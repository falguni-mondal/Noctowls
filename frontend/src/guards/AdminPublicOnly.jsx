import { Navigate, Outlet } from "react-router-dom"
import Loader from "../utils/loader/Loader";
import { useSelector } from "react-redux";

const AdminPublicOnly = () => {
  const { user } = useSelector(state => state.auth);
  const { admin, status } = useSelector(state => state.adminAuth);

  if (status === "loading") {
    return <Loader />
  }

  if (user && !user.isVerified) return <Navigate to="/account/verify" replace />

  if (user && user.isVerified) return <Navigate to="/" replace />

  if (admin && !admin.isVerified && location.pathname !== "/admin/account/verify") {
    return <Navigate to="/admin/account/verify" replace />;
  }

  if (admin && admin.isVerified) return <Navigate to="/admin/dashboard" replace />

  return <Outlet />
}

export default AdminPublicOnly