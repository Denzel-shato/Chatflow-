import React from 'react'
import { Link } from 'react-router-dom'

const NotFound = () => {
  return (
    <div className='h-screen w-full bg-gradient-to-r from-purple-500 to-purple-700  text-white text-[30px] *
    flex justify-center items-center font-semibold flex-col'>

  <p>Page does not Exist</p>   
 <Link to={`/`} > <p className='text-[20px] text-blue-300 underline'>Return Home</p> </Link>
      
    </div>
  )
}

export default NotFound
