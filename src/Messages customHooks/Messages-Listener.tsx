import { useQuery, useQueryClient } from "@tanstack/react-query"
import { db } from "../Firebase/firebase";
import { useEffect } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";

export default function useMessagesListerner({chatId}){

const queryClient = useQueryClient();

const queryMessages = useQuery({
queryKey:['messages',chatId],
queryFn:()=>[],
staleTime:Infinity,
enabled:!!chatId
})

useEffect(() => {
if (!chatId) return

const q = query(
collection(db, 'Chatrooms', chatId, 'messages'),
orderBy('lastMessageAt', 'asc')
)

const unsub = onSnapshot(q, (snap) => {
const chatMessages = snap.docs.map(d => ({ ...d.data(), messageId: d.id }))
queryClient.setQueryData(['messages',chatId],chatMessages)
})

return () => unsub()
}, [chatId])

return {messages:queryMessages.data || []}
}