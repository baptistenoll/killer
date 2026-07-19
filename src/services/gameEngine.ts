import { collection, doc, getDocs, runTransaction, updateDoc, writeBatch } from 'firebase/firestore'
import type { DocumentReference } from 'firebase/firestore'
import { db } from './firebase'
import { getPlayers } from '../repositories/playersRepository'

/**
 * Activates the game. Every player must already have a target and a mission
 * assigned beforehand (via setPlayerTarget / assignMissionToPlayer) — from
 * then on, kill validation carries the chain forward automatically.
 */
export async function startGame(gameId: string): Promise<void> {
  const players = await getPlayers(gameId)
  if (players.length < 2) {
    throw new Error('Il faut au moins 2 joueurs pour démarrer la partie.')
  }
  if (players.some((p) => !p.missionText)) {
    throw new Error('Attribue une mission à chaque joueur avant de démarrer.')
  }
  if (players.some((p) => !p.targetId)) {
    throw new Error('Attribue une cible à chaque joueur avant de démarrer.')
  }
  await updateDoc(doc(db, 'games', gameId), { status: 'active' })
}

export async function endGame(gameId: string): Promise<void> {
  await updateDoc(doc(db, 'games', gameId), { status: 'ended' })
}

/**
 * Frees any mission left marked "used" whose assignedTo doesn't match a player who
 * actually still holds it — leftover from kills that predate the fix that keeps this in sync.
 */
export async function repairOrphanedMissions(gameId: string): Promise<number> {
  const [missionsSnap, players] = await Promise.all([
    getDocs(collection(db, 'games', gameId, 'missions')),
    getPlayers(gameId),
  ])
  const heldMissionIds = new Set(players.filter((p) => p.missionId).map((p) => p.missionId))

  const orphaned = missionsSnap.docs.filter((d) => d.data().used && !heldMissionIds.has(d.id))
  if (orphaned.length === 0) return 0

  const batch = writeBatch(db)
  orphaned.forEach((d) => batch.update(d.ref, { used: false, assignedTo: null }))
  await batch.commit()
  return orphaned.length
}

/** Deletes a game along with its players, missions and kill claims subcollections. */
export async function deleteGame(gameId: string): Promise<void> {
  const subcollections = ['players', 'missions', 'killClaims']
  const refs: DocumentReference[] = []
  for (const sub of subcollections) {
    const snap = await getDocs(collection(db, 'games', gameId, sub))
    snap.docs.forEach((d) => refs.push(d.ref))
  }
  refs.push(doc(db, 'games', gameId))

  const CHUNK_SIZE = 450
  for (let i = 0; i < refs.length; i += CHUNK_SIZE) {
    const batch = writeBatch(db)
    refs.slice(i, i + CHUNK_SIZE).forEach((ref) => batch.delete(ref))
    await batch.commit()
  }
}

/**
 * Gives a player a mission from the pool, freeing whichever mission they held before.
 * Pass missionId null to just clear the player's current mission.
 */
export async function assignMissionToPlayer(
  gameId: string,
  playerId: string,
  missionId: string | null,
): Promise<void> {
  await runTransaction(db, async (tx) => {
    const playerRef = doc(db, 'games', gameId, 'players', playerId)
    const playerSnap = await tx.get(playerRef)
    if (!playerSnap.exists()) throw new Error('Joueur introuvable.')
    const previousMissionId: string | null = playerSnap.data().missionId

    const previousRef = previousMissionId
      ? doc(db, 'games', gameId, 'missions', previousMissionId)
      : null
    const newRef = missionId ? doc(db, 'games', gameId, 'missions', missionId) : null

    const newSnap = newRef ? await tx.get(newRef) : null
    if (newRef && !newSnap?.exists()) throw new Error('Mission introuvable.')

    if (previousRef && previousMissionId !== missionId) {
      tx.update(previousRef, { used: false, assignedTo: null })
    }
    if (newRef) {
      tx.update(newRef, { used: true, assignedTo: playerId })
    }
    tx.update(playerRef, {
      missionId,
      missionText: newSnap?.exists() ? newSnap.data().text : null,
    })
  })
}

/** Edits a mission's text, propagating the change to the player currently holding it. */
export async function updateMissionText(
  gameId: string,
  missionId: string,
  text: string,
): Promise<void> {
  await runTransaction(db, async (tx) => {
    const missionRef = doc(db, 'games', gameId, 'missions', missionId)
    const missionSnap = await tx.get(missionRef)
    if (!missionSnap.exists()) throw new Error('Mission introuvable.')
    const mission = missionSnap.data()

    tx.update(missionRef, { text })
    if (mission.assignedTo) {
      tx.update(doc(db, 'games', gameId, 'players', mission.assignedTo), { missionText: text })
    }
  })
}

/** Removes a mission from the pool, clearing it from whichever player holds it. */
export async function deleteMission(gameId: string, missionId: string): Promise<void> {
  await runTransaction(db, async (tx) => {
    const missionRef = doc(db, 'games', gameId, 'missions', missionId)
    const missionSnap = await tx.get(missionRef)
    if (!missionSnap.exists()) return
    const mission = missionSnap.data()

    if (mission.assignedTo) {
      tx.update(doc(db, 'games', gameId, 'players', mission.assignedTo), {
        missionId: null,
        missionText: null,
      })
    }
    tx.delete(missionRef)
  })
}

/**
 * Validates a kill claim: eliminates the victim, has the killer inherit the victim's
 * target and exact mission, and ends the game if no target is left to inherit.
 */
export async function approveKillClaim(gameId: string, claimId: string): Promise<void> {
  await runTransaction(db, async (tx) => {
    const claimRef = doc(db, 'games', gameId, 'killClaims', claimId)
    const claimSnap = await tx.get(claimRef)
    if (!claimSnap.exists() || claimSnap.data().status !== 'pending') {
      throw new Error('Cette demande a déjà été traitée.')
    }
    const claim = claimSnap.data()

    const killerRef = doc(db, 'games', gameId, 'players', claim.killerId)
    const victimRef = doc(db, 'games', gameId, 'players', claim.victimId)
    const [killerSnap, victimSnap] = await Promise.all([tx.get(killerRef), tx.get(victimRef)])
    const killer = killerSnap.data()
    const victim = victimSnap.data()
    if (!killer || !victim) throw new Error('Joueur introuvable.')

    const inheritedTargetId: string | null = victim.targetId
    const isWinner = inheritedTargetId === null || inheritedTargetId === claim.killerId

    tx.update(killerRef, {
      targetId: isWinner ? null : inheritedTargetId,
      missionId: null,
      missionText: isWinner ? null : victim.missionText,
      score: (killer.score ?? 0) + 1,
    })
    tx.update(victimRef, { status: 'eliminated', targetId: null, missionId: null, missionText: null })
    if (killer.missionId) {
      tx.update(doc(db, 'games', gameId, 'missions', killer.missionId), { used: false, assignedTo: null })
    }
    if (victim.missionId) {
      tx.update(doc(db, 'games', gameId, 'missions', victim.missionId), { used: false, assignedTo: null })
    }
    tx.update(claimRef, { status: 'approved', reviewedAt: Date.now() })
    if (isWinner) {
      tx.update(doc(db, 'games', gameId), { status: 'ended' })
    }
  })
}

/**
 * Admin override: eliminates a player directly, without going through a kill claim.
 * Whoever was hunting this player (if anyone) inherits their target and mission,
 * exactly as if that kill had been validated normally.
 */
export async function adminKillPlayer(gameId: string, playerId: string): Promise<void> {
  const players = await getPlayers(gameId)
  const killer = players.find((p) => p.targetId === playerId) ?? null

  await runTransaction(db, async (tx) => {
    const victimRef = doc(db, 'games', gameId, 'players', playerId)
    const victimSnap = await tx.get(victimRef)
    if (!victimSnap.exists()) throw new Error('Joueur introuvable.')
    const victim = victimSnap.data()

    if (killer) {
      const killerRef = doc(db, 'games', gameId, 'players', killer.id)
      const killerSnap = await tx.get(killerRef)
      const killerData = killerSnap.data()
      if (killerData) {
        const inheritedTargetId: string | null = victim.targetId
        const isWinner = inheritedTargetId === null || inheritedTargetId === killer.id
        tx.update(killerRef, {
          targetId: isWinner ? null : inheritedTargetId,
          missionId: null,
          missionText: isWinner ? null : victim.missionText,
          score: (killerData.score ?? 0) + 1,
        })
        if (killerData.missionId) {
          tx.update(doc(db, 'games', gameId, 'missions', killerData.missionId), {
            used: false,
            assignedTo: null,
          })
        }
        if (isWinner) {
          tx.update(doc(db, 'games', gameId), { status: 'ended' })
        }
      }
    }

    tx.update(victimRef, { status: 'eliminated', targetId: null, missionId: null, missionText: null })
    if (victim.missionId) {
      tx.update(doc(db, 'games', gameId, 'missions', victim.missionId), { used: false, assignedTo: null })
    }
  })
}

/** Brings a player back into the game; admin must reassign a target and mission afterward. */
export async function resurrectPlayer(gameId: string, playerId: string): Promise<void> {
  await updateDoc(doc(db, 'games', gameId, 'players', playerId), {
    status: 'alive',
    targetId: null,
    missionId: null,
    missionText: null,
  })
}

export async function rejectKillClaim(gameId: string, claimId: string): Promise<void> {
  await runTransaction(db, async (tx) => {
    const claimRef = doc(db, 'games', gameId, 'killClaims', claimId)
    const claimSnap = await tx.get(claimRef)
    if (!claimSnap.exists() || claimSnap.data().status !== 'pending') {
      throw new Error('Cette demande a déjà été traitée.')
    }
    tx.update(claimRef, { status: 'rejected', reviewedAt: Date.now() })
  })
}
