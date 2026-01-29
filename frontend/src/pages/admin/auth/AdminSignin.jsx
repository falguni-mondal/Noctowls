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
    <div className="w-full px-5 py-20" id="sign-in-page">
      <div className="account-header-container">
        <h1 className="account-heading text-3xl uppercase font-medium text-center leading-none px-3">
          noctowls member account
        </h1>
      </div>
      <div className="admin-signin-main-content">
        <div className="admin-signin-subheader">
          <p className="admin-signin-subheading w-[24ch] text-center mx-auto leading-none mt-5 text-zinc-300">
            Sign in with admin id and password.
          </p>
        </div>

        <form className="mt-5" id="admin-signin-form" onSubmit={handleSubmit}>
          {/* Email */}
          <div className="input-container w-full rounded-[3px] border border-zinc-900 p-1">
            <label
              className="form-input-label admin-signin-input-label capitalize text-xs text-zinc-400 block"
              htmlFor="admin-signin-id"
            >
              admin id
            </label>

            <input
              className="w-full border-0 outline-0 bg-transparent text-white"
              type="email"
              id="admin-signin-id"
              name="email"
            />
          </div>

          {/* Email Error */}
          {errors.email && (
            <p className="text-red-500 text-xs mt-1">{errors.email}</p>
          )}

          {/* Password */}
          <div className="input-container w-full rounded-[3px] border border-zinc-900 p-1 pr-0 mt-4 relative">
            <div className="password-input-container w-[85%]">
              <label
                className="form-input-label admin-signin-input-label capitalize text-xs text-zinc-400 block"
                htmlFor="admin-signin-password"
              >
                password
              </label>

              <input
                className="w-full border-0 outline-0 bg-transparent text-white"
                type={passwordVisible ? "text" : "password"}
                id="admin-signin-password"
                name="password"
              />
            </div>

            <span
              onClick={() => setPasswordVisible((prev) => !prev)}
              className={`absolute top-1/2 right-0 -translate-y-1/2 h-[50px] w-[15%] flex items-center justify-center cursor-pointer ${passwordVisible ? "text-indigo-600" : "text-white"
                }`}
            >
              <Icon icon="hugeicons:view" />
            </span>
          </div>

          {/* Password Error */}
          {errors.password && (
            <p className="text-red-500 text-xs mt-1">{errors.password}</p>
          )}

          {/* Submit Button */}
          <div className="form-btn-container admin-signin-btn-container mt-5 w-full uppercase text-xs font-medium">
            <button
              key="admin-signin-btn"
              className="bg-indigo-700 rounded-[3px] w-full h-[45px] leading-none uppercase disabled:opacity-50 disabled:cursor-not-allowed"
              type="submit"
              disabled={login.status === "loading"}
            >
              {login.status === "loading" ? "Signing in..." : "sign in"}
            </button>
          </div>
        </form>

        {/* Server Error */}
        {login.error && (
          <p className="text-red-500 text-center text-xs mt-3">
            {login.error?.message || login.error}
          </p>
        )}
      </div>
    </div>
  );
};

export default AdminSignin;
