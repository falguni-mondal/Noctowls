import { useDispatch, useSelector } from 'react-redux';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import Loader from '../../utils/loader/Loader';
import { useEffect } from 'react';
import { checkAdmin } from '../../store/features/admin/adminAuthSlice';

const AdminOnly = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  
  // useEffect(() => {
  //   dispatch(checkAdmin());
  // }, [location.pathname])

  const { user } = useSelector(state => state.auth);
  const { admin, status } = useSelector(state => state.adminAuth);

  if (status === "loading" || status === "idle") {
    return <Loader />
  }

  if (user && !user.isVerified) return <Navigate to="/account/verify" replace />;

  if (user && user.isVerified) return <Navigate to="/" replace />;

  if (!admin) return <Navigate to="/admin/signin" replace />;

  if (admin && !admin.isVerified) return <Navigate to="/admin/verify" replace />;

  return <Outlet />
}

export default AdminOnly