import React, { useEffect, useState } from 'react'
import Navbar from './components/header/navbar/Navbar';
import Label from './components/header/Label';
import TextSwiper from './components/header/textSwiper/TextSwiper';
import PageRouter from './routes/PageRouter';
import FooterLogo from './components/footer/FooterLogo';
import FooterDets from './components/footer/footer-dets/FooterDets';
import Copyright from './components/footer/Copyright';
import FooterNav from './components/mobile/footer-nav/FooterNav';
import { useLocation } from 'react-router-dom';
import TopNavMenu from './components/mobile/TopNavMenu';
import { Bounce, ToastContainer } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import { checkAuth, selectUser } from './store/features/user/authSlice';
import { checkAdmin } from './store/features/admin/adminAuthSlice';
import { getCart } from './store/features/user/cartSlice';

const App = () => {
  const location = useLocation();
  const [showNav, setShowNav] = useState(false);
  const dispatch = useDispatch();
  const user = useSelector(selectUser);

  useEffect(() => {
    dispatch(checkAuth());
    dispatch(checkAdmin());
  }, []);

  useEffect(() => {
    dispatch(getCart());
  }, [user])

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname])



  return (
    <div className='container'>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
        transition={Bounce}
      />

      <Label />
      <Navbar setShowNav={setShowNav} />
      <TextSwiper />
      <TopNavMenu showNav={showNav} setShowNav={setShowNav} />
      <main className='w-full border-b-[0.5px] border-zinc-700'>
        <PageRouter />
      </main>
      <footer className='pt-10 w-full flex flex-col' id='footer'>
        <FooterLogo />
        <FooterDets />
        <Copyright />
      </footer>
      <FooterNav />
    </div>
  )
}

export default App