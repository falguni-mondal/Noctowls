import { Icon } from "@iconify/react";
import { useState } from "react";
import { Link } from "react-router-dom";

const Signin = () => {
    const [passwordVisible, setPasswordVisible] = useState(false);

    return (
        <div className='w-full px-5' id='sign-in-page'>
            <div className="signin-main-content">
                <div className="signin-subheader">
                    <p className='signin-subheading w-[24ch] text-center mx-auto leading-none mt-5 text-zinc-300'>Sign in with your email and password.</p>
                </div>
                <form className='mt-5' id="signin-form">
                    <div className="input-container w-full rounded-[3px] border border-zinc-900 p-1">
                        <label className='form-input-label signin-input-label capitalize text-xs text-zinc-400 block' htmlFor="signin-email">email</label>
                        <input className='w-full border-0 outline-0' type="email" id='signin-email' />
                    </div>
                    <div className="input-container w-full rounded-[3px] border border-zinc-900 p-1 pr-0 mt-4 relative">
                        <div className="password-input-container w-[85%]">
                            <label className='form-input-label signin-input-label capitalize text-xs text-zinc-400 block' htmlFor="signin-password">password</label>
                            <input className='w-full border-0 outline-0' type={`${passwordVisible ? "text" : "password"}`} id='signin-password' />
                        </div>

                        <span onClick={() => setPasswordVisible(prev => !prev)} className={`absolute top-1/2 right-0 -translate-y-1/2 h-[50px] w-[15%] flex items-center justify-center ${passwordVisible ? "text-indigo-600" : "text-white"}`}>
                            <Icon className={``} icon="hugeicons:view" />
                        </span>
                    </div>
                    <div className="forgot-password-link-container text-right mt-1">
                        <Link className="text-xs text-indigo-200 font-medium underline" to={`/forgot password/${""}`}>Fogot Password?</Link>
                    </div>
                    <div className="form-btn-container signin-btn-container mt-5 w-full uppercase text-xs font-medium">
                        <button key="signin-btn" className='bg-indigo-700 rounded-[3px] w-full h-[45px] leading-none uppercase' type='submit'>sign in</button>
                        <span className="my-3 text-indigo-200 block w-fit mx-auto font-medium text-[0.65rem]">or</span>
                        <div key="signin-google-btn" className="google-btn w-full bg-indigo-200 h-[45px] rounded-[3px] flex items-center justify-center gap-1 text-black mt-2">
                            <span>login with google</span>
                            <Icon className="text-lg" icon="material-icon-theme:google" />
                        </div>
                    </div>
                </form>
                <div className="signup-link-container w-full mt-5 flex gap-1 text-zinc-400 text-sm">
                    <p>New on Noctowls?</p>
                    <Link className="underline text-indigo-200 font-medium" to="/account/signup">Create an Account</Link>
                </div>
            </div>
        </div>
    )
}

export default Signin