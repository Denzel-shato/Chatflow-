import React from 'react'
import { Link } from 'react-router-dom'

const Status = () => {
  return (
    
      
    <div className='min-h-screen w-full grid grid-cols-1 md:grid-cols-15  bg-gradient-to-r from-purple-800 to-purple-950'>
      <div className="  relative   md:col-span-7 lg:col-span-5  text-white font-semibold  ">
       <div className="flex justify-center items-center w-full flex-col">Status</div>




       <div className="mt-3 w-full h-[30px] flex justify-between absolute bottom-3  mb-5">
       <Link to={'/Status'} ><img src="/user.png" alt="" className='rounded-[65%] h-[30px] ring-2 ml-3' /><p className='ml-1'>Status</p></Link>
      <Link to={'/Calls'}><img src="/phone.png" alt="" className='rounded-[65%] h-[30px] ring-2 ' /><p className='translate-x-[-3px] '>Calls</p></Link>
      <Link to={'/Messages'}><img src="/chat.png" alt="" className='rounded-[65%] h-[30px] ring-2  ml-3' /><p className='translate-x-[-10px] '>Messages</p></Link>
      <Link to={'/Settings'}><img src="/settings.png" alt="" className='rounded-[65%] h-[30px] ring-2 mr-4' /><p className='translate-x-[-14px] '>Settings</p></Link>
      
      
     </div>
    </div>


<div className="w-1 h-full modern-button "></div>
     <div className="hidden md:block md:col-span-7 lg:col-span-9 w-full  items-center text-center text-white text-5xl ">Conversation
     </div>


    </div>
  )
}

export default Status
