import { Link, NavLink } from 'react-router-dom';
import { Icon } from "@iconify/react";
import Logo from '../../../utils/logo/Logo';
import { useSelector } from 'react-redux';

import { selectCart } from '../../../store/features/user/cartSlice'; 

const Navbar = ({ setShowNav }) => {
    const user = useSelector(state => state.auth.user);
    const admin = useSelector(state => state.adminAuth.admin);
    const cart = useSelector(selectCart);

    // Links configuration
    const links = [
        { title: "home", link: "/" },
        { title: "catalog", link: "/catalog" },
        { title: "contact", link: "/contact" },
    ];

    return (
        <header className='sticky top-0 left-0 z-999 bg-black flex justify-between items-center text-2xl w-full py-4 border-t border-zinc-700 px-5 print:hidden' id="mobile-navbar">
            
            {/* Hamburger: Hidden on Large Screens */}
            <div className="nav-icon w-[30%] lg:hidden">
                <div onClick={() => setShowNav(true)} className="hamburger w-fit cursor-pointer">
                    <Icon icon="fluent:navigation-24-regular" />
                </div>
            </div>

            {/* Left Side: Logo + Desktop Navigation */}
            {/* On Mobile: Just Logo. On Desktop: Logo + Links */}
            <div className="logo flex items-center gap-8 lg:gap-10">
                <Logo width="w-[88px]" />
                
                {/* Desktop Navigation Links */}
                <ul className="hidden lg:flex items-center gap-8 text-sm font-medium text-zinc-300">
                    {links.map(({ title, link }) => (
                        <li key={`${title}-desktop-nav`}>
                            <NavLink 
                                to={link} 
                                className={({ isActive }) => 
                                    `capitalize ${isActive ? "text-red-600 font-medium" : ""}`
                                }
                            >
                                {title}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Right Side: Icons */}
            <nav className="nav-icons flex gap-4 w-[30%] lg:w-auto justify-end items-center">
                <span className="cursor-pointer hover:text-zinc-300 transition-colors">
                    <Icon icon="basil:search-solid" />
                </span>
                {
                    !user && !admin?.isVerified &&
                    <Link to="/admin/signin" className="hover:text-zinc-300 transition-colors">
                        <Icon icon="material-symbols-light:lock-person-outline" />
                    </Link>
                }
                {
                    !admin &&
                    <Link to="/bag" className='relative hover:text-zinc-300 transition-colors'>
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