import { useDispatch, useSelector } from "react-redux";
import { otpVerifier, otpSender, deleteAccount } from "../../store/features/user/authSlice";
import { toast } from "react-toastify";
import MiniLoading from "../../utils/loader/MiniLoading";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toastControls from "../../utils/global/toastControls";

const Verify = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { otpVerifier: otpState, otpSender: resendState, nextResendAt } =
        useSelector((state) => state.auth);

    const [secondsLeft, setSecondsLeft] = useState(0);

    // Calculate countdown from Redux nextResendAt
    useEffect(() => {
        if (!nextResendAt) {
            setSecondsLeft(0);
            return;
        }
        setSecondsLeft(
            Math.max(0, Math.floor((nextResendAt - Date.now()) / 1000))
        );

        const interval = setInterval(() => {
            const sec = Math.max(
                0,
                Math.floor((nextResendAt - Date.now()) / 1000)
            );
            setSecondsLeft(sec);
        }, 1000);

        return () => clearInterval(interval);
    }, [nextResendAt]);


    // 🔥 OTP verification
    const handleVerify = async (e) => {
        e.preventDefault();

        const formData = new FormData(e.target);
        const otp = formData.get("otp")?.trim();

        // 🔥 Validate OTP
        if (!otp) {
            toast.error("Please enter the OTP.", toastControls);
            return;
        }

        if (!/^\d{6}$/.test(otp)) {
            toast.error("OTP must be a 6-digit number.", toastControls);
            return;
        }

        const res = await dispatch(otpVerifier({ code: otp }));

        if (res?.meta?.requestStatus === "fulfilled") {
            toast.success("Logged In!", toastControls);
            navigate("/");
        } else {
            toast.error(res?.payload?.message || "Invalid OTP.", toastControls);
        }
    };


    // 🔥 Handle Resend OTP
    const handleResend = async () => {
        if (secondsLeft > 0) {
            toast.error("Please wait before resending OTP.");
            return;
        }

        const res = await dispatch(otpSender());

        if (res?.meta?.requestStatus === "fulfilled") {
            toast.success("OTP resent!");
        } else {
            toast.error(res?.payload?.message || "Failed to resend OTP.");
        }
    };

    const handleAccountReset = async () => {
        const res = await dispatch(deleteAccount());

        if (res?.meta?.requestStatus === "fulfilled") {
            navigate("/account/signin");
        } else {
            toast.error(res?.payload?.message || "Failed to delete account.", toastControls);
        }
    };


    return (
        <div className="w-full px-5 md:max-w-md md:mx-auto md:px-0" id='verify-page'>
            <div className="verify-subheader">
                {/* Light theme subheading */}
                <p className='verify-subheading w-[24ch] text-center mx-auto leading-none mt-5 text-zinc-600 font-medium'>
                    Verify with the OTP sent to your email.
                </p>
            </div>

            <form className='mt-6' id="verify-form" onSubmit={handleVerify}>
                {/* Light theme input container: White bg, subtle border, red focus ring */}
                <div className="input-container w-full rounded-lg border border-zinc-300 p-2 bg-white shadow-sm focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500/50 transition-all">
                    <label
                        className='form-input-label verify-input-label text-[10px] font-bold uppercase tracking-wider text-zinc-500 block ml-1'
                        htmlFor="verify-otp"
                    >
                        OTP
                    </label>

                    <input
                        // Light theme input text
                        className='w-full border-0 outline-0 bg-transparent text-[#0f0f0f] font-medium px-1 mt-1 placeholder-zinc-400 tracking-widest'
                        type="text"
                        id='verify-otp'
                        name="otp"
                        placeholder="123456"
                        autoComplete="one-time-code"
                        maxLength="6"
                    />
                </div>

                {/* RESEND OTP SECTION */}
                <div className="text-right mt-2 text-xs font-medium text-zinc-500">
                    {secondsLeft > 0 ? (
                        <p>Resend OTP in <span className="text-red-600 font-bold">{secondsLeft}s</span></p>
                    ) : (
                        <button
                            className='text-[#0f0f0f] hover:text-red-600 font-bold underline transition-colors disabled:text-zinc-400 disabled:no-underline disabled:cursor-not-allowed'
                            onClick={handleResend}
                            disabled={resendState.status === "loading"}
                            type="button"
                        >
                            Resend
                        </button>
                    )}
                </div>

                {/* VERIFY BUTTON */}
                <div className="form-btn-container verify-btn-container mt-6 w-full uppercase text-xs font-bold tracking-widest">
                    <button
                        key="verify-btn"
                        // Light theme premium button: Dark #0f0f0f
                        className='bg-[#0f0f0f] text-white rounded-lg w-full h-[50px] flex items-center justify-center uppercase hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400 disabled:shadow-none disabled:cursor-not-allowed transition-all shadow-md'
                        type='submit'
                        disabled={otpState.status === "loading"}
                    >
                        {otpState.status === "loading" ? <MiniLoading /> : "Verify"}
                    </button>
                </div>
            </form>
            
            {/* Light theme account reset link */}
            <div className="account-reseter leading-tight text-[11px] mt-10 font-bold uppercase tracking-widest text-zinc-500 text-center">
                wrong email? 
                <button 
                    type="button" 
                    className="text-[#0f0f0f] hover:text-red-600 transition-colors underline cursor-pointer ml-1" 
                    onClick={handleAccountReset}
                >
                    Change Here
                </button>
            </div>
        </div>
    );
};

export default Verify;