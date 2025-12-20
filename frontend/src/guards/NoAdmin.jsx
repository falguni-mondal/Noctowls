import { Navigate, Outlet } from "react-router-dom"
import Loader from "../utils/loader/Loader";
import { useSelector } from "react-redux";

const NoAdmin = () => {
  const {admin, status} = useSelector(state => state.adminAuth);

  if (status === "loading" || status === "idle") {
    return <Loader />
  }

  if (admin && !admin.isVerified) return <Navigate to="/admin/verify" replace />

  if (admin && admin.isVerified) return <Navigate to="/admin/dashboard" replace />

  return <Outlet />
}

export default NoAdmin