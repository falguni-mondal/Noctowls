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
import SocialLinks from './components/footer/footer-dets/SocialLinks';

// [!code ++] IMPORT META PIXEL UTILS
import { initPixel, trackEvent } from './utils/pixel/pixel';

// IMPORT SEARCH ACTIONS AND SELECTORS
import {
  searchProducts,
  clearSearchResults,
  selectSearchResults,
  selectSearchLoading
} from './store/features/user/productSlice';
import { Icon } from '@iconify/react/dist/iconify.js';

const App = () => {
  const location = useLocation();
  const [showNav, setShowNav] = useState(false);
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const admin = useSelector(state => state.adminAuth.admin);

  // --- LIFTED SEARCH STATE ---
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchResults = useSelector(selectSearchResults);
  const searchLoading = useSelector(selectSearchLoading);

  // [!code ++] META PIXEL INITIALIZATION
  useEffect(() => {
    initPixel();
  }, []);

  // [!code ++] TRACK PAGE VIEWS ON ROUTE CHANGE
  useEffect(() => {
    trackEvent('PageView');
  }, [location]);

  useEffect(() => {
    dispatch(checkAuth());
    dispatch(checkAdmin());
  }, [dispatch]);

  useEffect(() => {
    dispatch(getCart());
  }, [user, dispatch]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // --- GLOBAL DEBOUNCE SEARCH LOGIC (0.8s) ---
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.trim()) {
        dispatch(searchProducts(query));
      } else {
        dispatch(clearSearchResults());
      }
    }, 800); // 0.8 seconds delay

    return () => clearTimeout(delayDebounceFn);
  }, [query, dispatch]);

  // --- SEARCH HANDLERS ---
  const handleOpenSearch = () => {
    setIsSearchOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll top so user sees the bar
  };

  const handleCloseSearch = () => {
    setIsSearchOpen(false);
    setQuery("");
    dispatch(clearSearchResults());
  };

  return (
    <div className='container'>

      {
        !admin &&
        <div className='whatsapp-container lg:hidden fixed bottom-20 right-3 text-5xl z-99999'>
          <a href="https://wa.me/8348341112" target='_blank' className='block text-green-700 backdrop-blur-lg rounded-lg bg-black/25 overflow-hidden'>
            <Icon icon="uil:whatsapp-alt" className='pointer-events-none'/>
          </a>
        </div>
      }
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
      
      {/* Pass Search Props to Navbar */}
      <Navbar 
        setShowNav={setShowNav}
        isSearchOpen={isSearchOpen}
        setIsSearchOpen={setIsSearchOpen}
        query={query}
        setQuery={setQuery}
        searchResults={searchResults}
        searchLoading={searchLoading}
        closeSearch={handleCloseSearch}
      />
      
      <TextSwiper />
      <TopNavMenu showNav={showNav} setShowNav={setShowNav} />
      
      <main className='w-full border-b-[0.5px] border-zinc-700'>
        <PageRouter />
      </main>
      
      <footer className='pt-10 w-full flex flex-col' id='footer'>
        <div className="upper-footer w-full lg:flex lg:flex-col border-b-[0.5px] border-zinc-700 lg:px-5">
          <div className="upper-footer-dets w-full lg:flex lg:justify-between">
            <FooterLogo />
            {/* Pass Open Handler to FooterDets */}
            <FooterDets openSearch={handleOpenSearch} />
          </div>
          <SocialLinks />
        </div>
        <Copyright />
      </footer>
      
      <FooterNav />
    </div>
  )
}

export default App;