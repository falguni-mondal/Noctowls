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
        <div className="w-full px-5 md:max-w-md md:mx-auto md:px-0" id='sign-in-page'>
            <div className="signin-subheader">
                {/* Light theme subheading */}
                <p className='signin-subheading w-[24ch] text-center mx-auto leading-none mt-5 text-zinc-600 font-medium'>
                    Sign in with your email.
                </p>
            </div>

            <form className='mt-6' id="signin-form" onSubmit={handleSignin}>
                {/* Light theme input container: White bg, subtle border, red focus ring */}
                <div className="input-container w-full rounded-lg border border-zinc-300 p-2 bg-white shadow-sm focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500/50 transition-all">
                    <label
                        className='form-input-label signin-input-label text-[10px] font-bold uppercase tracking-wider text-zinc-500 block ml-1'
                        htmlFor="signin-email"
                    >
                        Email
                    </label>

                    <input
                        // Light theme input text
                        className='w-full border-0 outline-0 bg-transparent text-[#0f0f0f] font-medium px-1 mt-1 placeholder-zinc-400'
                        type="email"
                        id='signin-email'
                        name="email"
                        placeholder="e.g. hello@example.com"
                        autoComplete="email"
                    />
                </div>

                <div className="form-btn-container signin-btn-container mt-6 w-full uppercase text-xs font-bold tracking-widest">
                    <button
                        key="signin-btn"
                        // Light theme premium button: Dark #0f0f0f instead of indigo
                        className='bg-[#0f0f0f] text-white rounded-lg w-full h-[50px] flex items-center justify-center uppercase hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400 disabled:shadow-none disabled:cursor-not-allowed transition-all shadow-md'
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