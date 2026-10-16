import { useQuery, useQueryClient } from "@tanstack/react-query"
import { getDatabase, onValue, ref } from "firebase/database"
import { collection, onSnapshot, query, where } from "firebase/firestore"
import { useEffect } from "react"
import { db } from "../Firebase/firebase"

export default function useChatroom({chatId , uid , contactsUid  }){
const queryClient = useQueryClient()

const queryChatroom = useQuery({
queryKey:['chatRoom',chatId],
queryFn:()=>[],
staleTime:Infinity,
gcTime:Infinity,
enabled:!!chatId
})

const queryStatus = useQuery({
queryKey:['status',contactsUid],
queryFn:()=>[],
staleTime:Infinity,
gcTime:Infinity,
enabled:!!contactsUid && !!chatId
})


useEffect(() => {
if (!chatId) return

const q = query(
    collection(db, 'Chatrooms'),
    where('chatId', '==', chatId),
    where('participants', 'array-contains', uid)
)
let valueUnsub;
const unsub = onSnapshot(
  q,
  (snap) => {
    if (snap.empty) return;
    const data = snap.docs.map((d) => ({ ...d.data() }));
    const other = data[0].participantsInfo.find((p) => p.uid !== uid);
    queryClient.setQueryData(["chatRoom", chatId], data);

    /* Realtime presence */
    if (contactsUid) {
      if (valueUnsub) valueUnsub();
      const rtdb = getDatabase();
      const statusRef = ref(rtdb, `status/${contactsUid}`);
      valueUnsub = onValue(statusRef, (snap) => {
        if (snap.val())
          queryClient.setQueryData(["status", contactsUid], snap.val());
      });
    }
  },
  (err) => console.error("snap shot error 7", err.code)
);

return () =>{unsub() ; if(valueUnsub)valueUnsub()}
}, [chatId, uid, contactsUid, queryClient])
  

  
return {response:queryChatroom.data ,status:queryStatus.data }

}