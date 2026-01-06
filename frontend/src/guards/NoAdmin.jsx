import { Navigate, Outlet } from "react-router-dom"
import Loader from "../utils/loader/Loader";
import { useSelector } from "react-redux";

const NoAdmin = () => {
  const { admin, status } = useSelector(state => state.adminAuth);

  // FIX: Only show loader if explicitly loading. 
  // If 'idle', we assume check hasn't run or isn't needed, so we proceed.
  if (status === "loading") {
    return <Loader />
  }

  if (admin && !admin.isVerified) return <Navigate to="/admin/verify" replace />

  if (admin && admin.isVerified) return <Navigate to="/admin/dashboard" replace />

  return <Outlet />
}

export default NoAdmin