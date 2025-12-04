import { Icon } from "@iconify/react";
import { useState } from "react";

const AdminSignin = () => {
    const [passwordVisible, setPasswordVisible] = useState(false);

    return (
        <div className='w-full px-5' id='sign-in-page'>
            <div className="admin-signin-main-content">
                <div className="admin-signin-subheader">
                    <p className='admin-signin-subheading w-[24ch] text-center mx-auto leading-none mt-5 text-zinc-300'>Sign in with admin id and password.</p>
                </div>
                <form className='mt-5' id="admin-signin-form">
                    <div className="input-container w-full rounded-[3px] border border-zinc-900 p-1">
                        <label className='form-input-label admin-signin-input-label capitalize text-xs text-zinc-400 block' htmlFor="admin-signin-id">admin id</label>
                        <input className='w-full border-0 outline-0' type="email" id='admin-signin-id' />
                    </div>
                    <div className="input-container w-full rounded-[3px] border border-zinc-900 p-1 pr-0 mt-4 relative">
                        <div className="password-input-container w-[85%]">
                            <label className='form-input-label admin-signin-input-label capitalize text-xs text-zinc-400 block' htmlFor="admin-signin-password">password</label>
                            <input className='w-full border-0 outline-0' type={`${passwordVisible ? "text" : "password"}`} id='admin-signin-password' />
                        </div>

                        <span onClick={() => setPasswordVisible(prev => !prev)} className={`absolute top-1/2 right-0 -translate-y-1/2 h-[50px] w-[15%] flex items-center justify-center ${passwordVisible ? "text-indigo-600" : "text-white"}`}>
                            <Icon className={``} icon="hugeicons:view" />
                        </span>
                    </div>
                    <div className="form-btn-container admin-signin-btn-container mt-5 w-full uppercase text-xs font-medium">
                        <button key="admin-signin-btn" className='bg-indigo-700 rounded-[3px] w-full h-[45px] leading-none uppercase' type='submit'>sign in</button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default AdminSignin