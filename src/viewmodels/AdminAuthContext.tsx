import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import type { User } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db, isFirebaseConfigured } from '../services/firebase'

interface AdminAuthState {
  user: User | null
  isAdmin: boolean
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOutAdmin: () => Promise<void>
}

const AdminAuthContext = createContext<AdminAuthState | null>(null)

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false)
      return
    }
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser || firebaseUser.isAnonymous) {
        setUser(null)
        setIsAdmin(false)
        setLoading(false)
        return
      }
      const adminDoc = await getDoc(doc(db, 'admins', firebaseUser.uid))
      setUser(firebaseUser)
      setIsAdmin(adminDoc.exists())
      setLoading(false)
    })
  }, [])

  async function signIn(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password)
  }

  async function signOutAdmin() {
    await signOut(auth)
  }

  return (
    <AdminAuthContext.Provider value={{ user, isAdmin, loading, signIn, signOutAdmin }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth(): AdminAuthState {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider')
  return ctx
}
