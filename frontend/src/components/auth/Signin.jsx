import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../../store/features/user/authSlice";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import toastControls from "../../utils/global/toastControls";
import MiniLoading from "../../utils/loader/MiniLoading";

const Signin = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { login } = useSelector((state) => state.auth);

    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const handleSignin = async (e) => {
        e.preventDefault();

        const formData = new FormData(e.target);
        const email = formData.get("email")?.trim();

        if (!email) {
            toast.error("Invalid Email!", toastControls);
            return;
        }

        if (!emailRegex.test(email)) {
            toast.error("Invalid Email!", toastControls);
            return;
        }

        const res = await dispatch(loginUser({ email }));

        if (res?.meta?.requestStatus === "fulfilled") {
            navigate("/account/verify");
        } else {
            const errorMessage = res?.payload?.message || "Failed to login.";

            if (errorMessage.toLowerCase().includes("locked")) {
                toast.error(`Account Locked! ${errorMessage}`, {
                    autoClose: 10000,
                });
            } else {
                toast.error(errorMessage, toastControls);
            }
        }
    };

    return (
        <div className="w-full px-5" id='sign-in-page'>
            <div className="signin-subheader">
                <p className='signin-subheading w-[24ch] text-center mx-auto leading-none mt-5 text-zinc-300'>
                    Sign in with your email.
                </p>
            </div>

            <form className='mt-5' id="signin-form" onSubmit={handleSignin}>
                <div className="input-container w-full rounded-[3px] border border-zinc-900 p-1">
                    <label
                        className='form-input-label signin-input-label text-xs text-zinc-400 block'
                        htmlFor="signin-email"
                    >
                        Email
                    </label>

                    <input
                        className='w-full border-0 outline-0 bg-transparent text-zinc-200'
                        type="email"
                        id='signin-email'
                        name="email"
                        autoComplete="email"
                    />
                </div>

                <div className="form-btn-container signin-btn-container mt-5 w-full uppercase text-xs font-medium">
                    <button
                        key="signin-btn"
                        className='bg-indigo-700 rounded-[3px] w-full h-[45px] leading-none uppercase disabled:bg-indigo-900 relative'
                        type='submit'
                        disabled={login.status === "loading"}
                    >
                        {login.status === "loading" ? <MiniLoading /> : "Continue"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Signin;
