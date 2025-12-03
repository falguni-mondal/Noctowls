import React from 'react'
import AuthRouter from '../../routes/AuthRouter'

const Account = () => {
  return (
    <div className='w-full py-20' id='auth-page'>
      <div className="account-header-container">
        <h1 className="account-heading text-3xl uppercase font-medium text-center leading-none px-3">
          my noctowls account
        </h1>
      </div>
      <AuthRouter />
    </div>
  )
}

export default Account