import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addDoc, collection, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../Firebase/firebase";

export default function useSendMessages({chatId , userData}){
 const queryKey = ['messages',chatId];
    const queryClient = useQueryClient();
  
    type PropsType ={
      text:string;
      mediaUrl:string;
      type:string
    }

    return useMutation({
        mutationFn: async({ text, mediaUrl, type }:PropsType)=>{
        const messageRef =  await addDoc(collection(db, 'Chatrooms', chatId, 'messages'), {
                text : text ||null ,
                mediaUrl: mediaUrl || null,
                type: type || 'text',
                senderId: userData[0].uid,
                senderName: userData[0].displayName || userData[0].email,
                timestamp: serverTimestamp(),
                readBy: [userData[0].uid],
                lastMessageAt: serverTimestamp(),
              })
            const updateChatroom = await updateDoc(doc(db, 'Chatrooms', chatId), {
                messageAt: serverTimestamp(),
                lastMessage: type =='image' ? '📷 image' : text,
                lastMessageAt: serverTimestamp(),
              })
           return {messageRef , updateChatroom}
            },
            onMutate: async (variables) => {
                await queryClient.cancelQueries({ queryKey });
                const previousMessages = queryClient.getQueryData(queryKey);
              
                queryClient.setQueryData(queryKey, (old:string[] = []) => [
                  ...old,
                  {
                    id: `temp-${Date.now()}`,
                    ...variables, 
                    senderId: userData[0].uid,
                    timestamp: new Date(),
                    isOptimistic: true,
                  },
                ]);
                return { previousMessages };
            },
            onError: (err, text, context) => {
                if (context?.previousMessages) {
                  queryClient.setQueryData(queryKey, context.previousMessages);
                }
                console.error("Mutation failed, rolled back to snapshot:", err);
              },
              onSettled: () => {
                // queryClient.invalidateQueries({ queryKey });
                // queryClient.invalidateQueries({ queryKey: ['chats', userData[0]?.uid]})
              },

         })   

    
    

}