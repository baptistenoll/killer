import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
} from 'firebase/firestore'
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore'
import { db } from '../services/firebase'
import type { Player } from '../models'

function playersCollection(gameId: string) {
  return collection(db, 'games', gameId, 'players')
}

function toPlayer(snap: QueryDocumentSnapshot<DocumentData>): Player {
  const data = snap.data()
  return {
    id: snap.id,
    gameId: data.gameId,
    name: data.name,
    accessCode: data.accessCode,
    status: data.status,
    score: data.score,
    photoUrl: data.photoUrl,
    targetId: data.targetId,
    missionId: data.missionId,
    missionText: data.missionText,
    boundUid: data.boundUid,
  }
}

/** Generates a random 4-digit access code. Uniqueness within a game is not enforced. */
export function generateAccessCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000))
}

export async function createPlayer(
  gameId: string,
  name: string,
  accessCode: string,
): Promise<string> {
  const ref = await addDoc(playersCollection(gameId), {
    gameId,
    name,
    accessCode,
    status: 'alive',
    score: 0,
    photoUrl: null,
    targetId: null,
    missionId: null,
    missionText: null,
    boundUid: null,
  })
  return ref.id
}

export function subscribePlayers(
  gameId: string,
  callback: (players: Player[]) => void,
): () => void {
  return onSnapshot(playersCollection(gameId), (snap) => {
    callback(snap.docs.map(toPlayer))
  })
}

export function subscribePlayer(
  gameId: string,
  playerId: string,
  callback: (player: Player | null) => void,
): () => void {
  return onSnapshot(doc(db, 'games', gameId, 'players', playerId), (snap) => {
    callback(snap.exists() ? toPlayer(snap as QueryDocumentSnapshot<DocumentData>) : null)
  })
}

export async function findPlayerByAccessCode(
  gameId: string,
  accessCode: string,
): Promise<Player | null> {
  const q = query(playersCollection(gameId), where('accessCode', '==', accessCode))
  const snap = await getDocs(q)
  return snap.empty ? null : toPlayer(snap.docs[0])
}

export async function bindPlayerToUid(
  gameId: string,
  playerId: string,
  uid: string,
): Promise<void> {
  await updateDoc(doc(db, 'games', gameId, 'players', playerId), { boundUid: uid })
}

/** Admin action: unbinds a player's PIN from its device, letting them log in from a new one. */
export async function unbindPlayer(gameId: string, playerId: string): Promise<void> {
  await updateDoc(doc(db, 'games', gameId, 'players', playerId), { boundUid: null })
}

export async function getPlayers(gameId: string): Promise<Player[]> {
  const snap = await getDocs(playersCollection(gameId))
  return snap.docs.map(toPlayer)
}

export async function setPlayerTarget(
  gameId: string,
  playerId: string,
  targetId: string | null,
): Promise<void> {
  await updateDoc(doc(db, 'games', gameId, 'players', playerId), { targetId })
}

export async function setPlayerPhoto(
  gameId: string,
  playerId: string,
  photoUrl: string | null,
): Promise<void> {
  await updateDoc(doc(db, 'games', gameId, 'players', playerId), { photoUrl })
}
