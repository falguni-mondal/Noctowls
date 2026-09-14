import { Icon } from "@iconify/react";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginAdmin } from "../../../store/features/admin/adminAuthSlice";
import toastControls from "../../../utils/global/toastControls";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const AdminSignin = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { login } = useSelector((state) => state.adminAuth);

    const [passwordVisible, setPasswordVisible] = useState(false);
    const [errors, setErrors] = useState({ email: "", password: "" });

    // EMAIL REGEX
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // -----------------------------
    // HANDLE SUBMIT
    // -----------------------------
    const handleSubmit = async (e) => {
        e.preventDefault();

        const formData = new FormData(e.target);
        const email = formData.get("email")?.trim();
        const password = formData.get("password")?.trim();

        let newErrors = { email: "", password: "" };
        let isValid = true;

        // Email Validation
        if (!email) {
            newErrors.email = "Admin Id is required.";
            isValid = false;
        } else if (!emailRegex.test(email)) {
            newErrors.email = "Enter a valid email address.";
            isValid = false;
        }

        // Password Validation
        if (!password) {
            newErrors.password = "Password cannot be empty.";
            isValid = false;
        }

        setErrors(newErrors);
        if (!isValid) return;

        // Dispatch Admin Login
        const res = await dispatch(loginAdmin({ email, password }));

        if (res?.meta?.requestStatus === "fulfilled") {
            navigate("/admin/verify");
        } else {
            toast.error(res?.payload?.message || "Failed to login.", toastControls);
        }
    };

    return (
        <div className="w-full px-5 py-20 md:max-w-md md:mx-auto md:px-0" id="sign-in-page">
            <div className="account-header-container">
                {/* Light theme heading */}
                <h1 className="account-heading text-3xl uppercase font-bold text-[#0f0f0f] text-center leading-none px-3 tracking-wide">
                    noctowls member account
                </h1>
            </div>
            <div className="admin-signin-main-content">
                <div className="admin-signin-subheader">
                    {/* Light theme subheading */}
                    <p className="admin-signin-subheading w-[24ch] text-center mx-auto leading-none mt-5 text-zinc-600 font-medium">
                        Sign in with admin id and password.
                    </p>
                </div>

                <form className="mt-6" id="admin-signin-form" onSubmit={handleSubmit}>
                    {/* Email Input */}
                    <div className="input-container w-full rounded-lg border border-zinc-300 p-2 bg-white shadow-sm focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500/50 transition-all">
                        <label
                            className="form-input-label admin-signin-input-label text-[10px] font-bold uppercase tracking-wider text-zinc-500 block ml-1"
                            htmlFor="admin-signin-id"
                        >
                            admin id
                        </label>

                        <input
                            className="w-full border-0 outline-0 bg-transparent text-[#0f0f0f] font-medium px-1 mt-1 placeholder-zinc-400"
                            type="email"
                            id="admin-signin-id"
                            name="email"
                            placeholder="email@example.com"
                        />
                    </div>

                    {/* Email Error */}
                    {errors.email && (
                        <p className="text-red-600 font-medium text-xs mt-1.5 ml-1">{errors.email}</p>
                    )}

                    {/* Password Input */}
                    <div className="input-container w-full rounded-lg border border-zinc-300 p-2 pr-0 mt-5 bg-white shadow-sm focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500/50 transition-all relative flex">
                        <div className="password-input-container w-[85%]">
                            <label
                                className="form-input-label admin-signin-input-label text-[10px] font-bold uppercase tracking-wider text-zinc-500 block ml-1"
                                htmlFor="admin-signin-password"
                            >
                                password
                            </label>

                            <input
                                className="w-full border-0 outline-0 bg-transparent text-[#0f0f0f] font-medium px-1 mt-1 placeholder-zinc-400"
                                type={passwordVisible ? "text" : "password"}
                                id="admin-signin-password"
                                name="password"
                                placeholder="••••••••"
                            />
                        </div>

                        {/* Light Theme Eye Icon Toggle */}
                        <span
                            onClick={() => setPasswordVisible((prev) => !prev)}
                            className={`absolute top-0 right-0 h-full w-[15%] flex items-center justify-center cursor-pointer transition-colors ${
                                passwordVisible ? "text-red-600" : "text-zinc-400 hover:text-[#0f0f0f]"
                            }`}
                        >
                            <Icon icon="hugeicons:view" className="text-lg" />
                        </span>
                    </div>

                    {/* Password Error */}
                    {errors.password && (
                        <p className="text-red-600 font-medium text-xs mt-1.5 ml-1">{errors.password}</p>
                    )}

                    {/* Submit Button */}
                    <div className="form-btn-container admin-signin-btn-container mt-8 w-full uppercase text-xs font-bold tracking-widest">
                        <button
                            key="admin-signin-btn"
                            className="bg-[#0f0f0f] text-white rounded-lg w-full h-[50px] flex items-center justify-center uppercase hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400 disabled:shadow-none disabled:cursor-not-allowed transition-all shadow-md"
                            type="submit"
                            disabled={login.status === "loading"}
                        >
                            {login.status === "loading" ? "Signing in..." : "sign in"}
                        </button>
                    </div>
                </form>

                {/* Server Error */}
                {login.error && (
                    <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm font-medium text-center">
                        <p>{login.error?.message || login.error}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminSignin;