import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';
import Loader from '../../utils/loader/Loader';

const AdminOnly = () => {
    const { user } = useSelector(state => state.auth);
  const { admin, status } = useSelector(state => state.adminAuth);

  if (status === "loading" || status === "idle") {
    return <Loader />
  }

  if (user && !user.isVerified) return <Navigate to="/account/verify" replace />;

  if (user && user.isVerified) return <Navigate to="/" replace />;

  if(!admin) return <Navigate to="/admin/signin" replace/>;

  if (admin && !admin.isVerified) return <Navigate to="/admin/verify" replace />;

  return <Outlet />
}

export default AdminOnly