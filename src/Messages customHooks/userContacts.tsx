import { useQuery, useQueryClient } from "@tanstack/react-query"
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore"
import { useEffect, useState } from "react"
import { db } from "../Firebase/firebase"
import { getAuth, onAuthStateChanged } from "firebase/auth"

//  Lives outside the hook — survives remounts, never resets to null
type userType={
  uid:string
}
let _user:userType | null =null

export default function useUserContacts() {
  const queryClient = useQueryClient()

  const [user, setUser] = useState(() => {
    // On remount: _user is already set, no flash
    // On first load: falls back to currentUser (may still be null)
    return _user ?? getAuth().currentUser
  })

  useEffect(() => {
    const unsub = onAuthStateChanged(getAuth(), (u) => {
      _user = u  // cache it at module level
      if (u) setUser(u)
    })
    return () => unsub()
  }, [])

  const queryInfo = useQuery({
    queryKey: ['chats', user?.uid],
    queryFn: () => [],
    enabled: !!user,
    staleTime: Infinity,
    gcTime: Infinity,
    initialData: () => queryClient.getQueryData(['chats', user?.uid]),
  })

  useEffect(() => {
    if (!user) return
    const q = query(
      collection(db, 'Chatrooms'),
      where('participants', 'array-contains', user.uid),
      orderBy('messageAt', 'desc')
    )
    const unsub = onSnapshot(
      q,
      (snap) => {
        queryClient.setQueryData(
          ["chats", user.uid],
          snap.docs.map((d) => ({ ...d.data(), id: d.id }))
        );
      },
      (err) => console.error("snap shot error 9", err.code)
    );
    return () => unsub()
  }, [user, queryClient])

  return queryInfo
}