import { Navigate, Outlet } from "react-router-dom"
import Loader from "../utils/loader/Loader";
import { useSelector } from "react-redux";

const PublicOnly = () => {
  const { user, status } = useSelector(state => state.auth);
  const admin = useSelector(state => state.adminAuth.admin);

  if (status === "loading" || status === "idle") {
    return <Loader />
  }

  if (admin && !admin.isVerified) return <Navigate to="/admin/account/verify" replace />

  if (admin && admin.isVerified) return <Navigate to="/admin/dashboard" replace />

  if (user && !user.isVerified && location.pathname !== "/account/verify") {
    return <Navigate to="/account/verify" replace />;
  }
  if (user && user.isVerified) return <Navigate to="/" replace />

  return <Outlet />
}

export default PublicOnly