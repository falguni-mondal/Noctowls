import { Navigate, Outlet } from "react-router-dom"
import Loader from "../utils/loader/Loader";
import { useSelector } from "react-redux";

const PublicOnly = () => {
  const { user, status } = useSelector(state => state.auth);

  if (status === "loading" || status === "idle") {
    return <Loader />
  }

  if (status === "success" && user && !user.isVerified) return <Navigate to="/account/verify" replace />

  if (status === "success" && user && user.isVerified && user.role === "user") return <Navigate to="/" replace />

  if (status === "success" && user && user.isVerified && user.role === "admin") return <Navigate to="/admin" replace />

  return <Outlet />
}

export default PublicOnly