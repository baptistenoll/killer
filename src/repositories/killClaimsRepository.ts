import { addDoc, collection, onSnapshot, query, where } from 'firebase/firestore'
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore'
import { db } from '../services/firebase'
import type { KillClaim } from '../models'

function killClaimsCollection(gameId: string) {
  return collection(db, 'games', gameId, 'killClaims')
}

function toKillClaim(snap: QueryDocumentSnapshot<DocumentData>): KillClaim {
  const data = snap.data()
  return {
    id: snap.id,
    gameId: data.gameId,
    killerId: data.killerId,
    victimId: data.victimId,
    missionText: data.missionText,
    status: data.status,
    submittedAt: data.submittedAt,
    reviewedAt: data.reviewedAt,
  }
}

export async function submitKillClaim(
  gameId: string,
  killerId: string,
  victimId: string,
  missionText: string,
): Promise<string> {
  const ref = await addDoc(killClaimsCollection(gameId), {
    gameId,
    killerId,
    victimId,
    missionText,
    status: 'pending',
    submittedAt: Date.now(),
    reviewedAt: null,
  })
  return ref.id
}

export function subscribePendingClaims(
  gameId: string,
  callback: (claims: KillClaim[]) => void,
): () => void {
  const q = query(killClaimsCollection(gameId), where('status', '==', 'pending'))
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(toKillClaim))
  })
}

export function subscribeOwnPendingClaim(
  gameId: string,
  killerId: string,
  callback: (claim: KillClaim | null) => void,
): () => void {
  const q = query(
    killClaimsCollection(gameId),
    where('killerId', '==', killerId),
    where('status', '==', 'pending'),
  )
  return onSnapshot(q, (snap) => {
    callback(snap.empty ? null : toKillClaim(snap.docs[0]))
  })
}
