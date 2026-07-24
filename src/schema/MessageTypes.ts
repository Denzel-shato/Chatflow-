import { Timestamp } from "firebase/firestore";

export type ParticipantsData ={
    displayName:string
    name:string;
    photoURL:string;
    uid:string;
    lastSeen:string|null;
    unreadCount:number | null
}
export type UserDataType ={
    displayName:string ;
    email:string;
    photoURL:string;
    searchEmail:string;
    searchName:string;
    uid:string;
}
export type ParticipantsInfo={
    name:string;
    photoURL:string;
    uid:string;
    unreadCount:number;
}

export type UserChat ={
    lastMessage:string;
    lastMessageAt:Timestamp | null;
    messageAt:Timestamp | null;
    participants:string[];
    participantsInfo:ParticipantsInfo[]
    typing?: {
        [uid:string]:boolean;
    }
}