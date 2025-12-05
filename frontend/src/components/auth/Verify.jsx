import { useDispatch, useSelector } from "react-redux";
import { otpVerifier, otpSender, deleteAccount } from "../../store/features/user/authSlice";
import { toast } from "react-toastify";
import MiniLoading from "../../utils/loader/MiniLoading";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toastControls from "../../utils/global/toastControls";

export const Verify = () => {
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
            toast.success("OTP resent to your email.");
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
        <div className="w-full px-5" id='verify-page'>
            <div className="verify-subheader">
                <p className='verify-subheading w-[24ch] text-center mx-auto leading-none mt-5 text-zinc-300'>
                    Verify with the OTP sent to your email.
                </p>
            </div>

            <form className='mt-5' id="verify-form" onSubmit={handleVerify}>
                <div className="input-container w-full rounded-[3px] border border-zinc-900 p-1">
                    <label
                        className='form-input-label verify-input-label text-xs text-zinc-400 block'
                        htmlFor="verify-otp"
                    >
                        OTP
                    </label>

                    <input
                        className='w-full border-0 outline-0 bg-transparent text-zinc-200'
                        type="text"
                        id='verify-otp'
                        name="otp"
                        autoComplete="one-time-code"
                    />
                </div>

                {/* RESEND OTP SECTION */}
                <div className="text-right mt-1 text-sm text-zinc-400">
                    {secondsLeft > 0 ? (
                        <p>Resend OTP in <span className="text-indigo-400">{secondsLeft}s</span></p>
                    ) : (
                        <button
                            className='text-indigo-400 underline disabled:text-zinc-600'
                            onClick={handleResend}
                            disabled={resendState.status === "loading"}
                            type="button"
                        >
                            Resend
                        </button>
                    )}
                </div>

                {/* VERIFY BUTTON */}
                <div className="form-btn-container verify-btn-container mt-5 w-full uppercase text-xs font-medium">
                    <button
                        key="verify-btn"
                        className='bg-indigo-700 rounded-[3px] w-full h-[45px] leading-none uppercase disabled:bg-indigo-900 relative'
                        type='submit'
                        disabled={otpState.status === "loading"}
                    >
                        {otpState.status === "loading" ? <MiniLoading /> : "Verify"}
                    </button>
                </div>
            </form>
            <div className="account-reseter leading-tight text-sm mt-10 font-medium uppercase">
                wrong email? <button type="button" className="text-indigo-400 font-medium underline cursor-pointer ml-1" onClick={handleAccountReset}>Change Here</button>
            </div>
        </div>
    );
};
