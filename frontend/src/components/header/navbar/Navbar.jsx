import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from "@iconify/react";
import Logo from '../../../utils/logo/Logo';
import { useSelector } from 'react-redux';

import { selectCart } from '../../../store/features/user/cartSlice'; 

const Navbar = ({ setShowNav }) => {
    const user = useSelector(state => state.auth.user);
    const admin = useSelector(state => state.adminAuth.admin);
    const cart = useSelector(selectCart);

    return (
        <header className='sticky top-0 left-0 z-999 bg-black flex justify-between items-center text-2xl w-full py-4 border-t border-zinc-700 px-5' id="mobile-navbar">
            <div className="nav-icon w-[30%]">
                <div onClick={() => setShowNav(true)} className="hamburger w-fit">
                    <Icon icon="fluent:navigation-24-regular" />
                </div>
            </div>
            <div className="logo">
                <Logo width="w-[88px]" />
            </div>
            <nav className="nav-icons flex gap-4 w-[30%] justify-end">
                <span>
                    <Icon icon="basil:search-solid" />
                </span>
                {
                    !user && !admin?.isVerified &&
                    <Link to="/admin/signin">
                        <Icon icon="material-symbols-light:lock-person-outline" />
                    </Link>
                }
                {
                    !admin &&
                    <Link to="/bag" className='relative'>
                        <Icon icon="solar:bag-3-outline" />
                        {/* Only show badge if totalQuantity > 0 and cart exists */}
                        <span className={`${!cart || cart?.summary?.totalQuantity === 0 ? "hidden" : "flex"} absolute -bottom-1 -right-1/3 w-4 aspect-square rounded-full bg-white justify-center items-center text-black text-[0.6rem] font-medium`}>
                            {cart?.summary?.totalQuantity || 0}
                        </span>
                    </Link>
                }
            </nav>
        </header>
    )
}

export default Navbar;