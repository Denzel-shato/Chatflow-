export type IncomingCall ={

    chatRoomId :string;
    callType :string
    callerId:string;
    callerName:string;
    callerPhoto:string
}
export type AppUserData = {
    displayName:string | null ;
    email:string | null;
    photoURL:string | null;
    uid:string | null;
}
export type CalleeInfo ={
    name:string;
    photoURL:string;
    uid?:string;
}