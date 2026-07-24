import React, { useState } from 'react'
import './Login.css'
import { auth,provider } from '../Firebase/firebase'
import {signInWithPopup} from 'firebase/auth' 
import Cookies from 'universal-cookie'
import { Outlet, useNavigate } from 'react-router-dom'
import Settings from './Nested Routes/Settings'
import Messages from './Nested Routes/Messages'


const Chat = () => {
const navigate=useNavigate()
const cookies = new Cookies()
const [result,setResult]=useState();
const[isauth,setIsauth]=useState(cookies.get("auth-token"))

const signInWithGoogle= async ()=>{

   try{

const res = await signInWithPopup(auth,provider);
cookies.set("auth-token",res.user.refreshToken)

setResult(res)
console.log(res)
   }catch(err){
      console.error(err)
   }

};

}

export default Chat