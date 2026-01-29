import { useState, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react/dist/iconify.js';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import { logoutUser } from '../../../store/features/user/authSlice';
import { toast } from 'react-toastify';
import toastControls from '../../../utils/global/toastControls';
import { logoutAdmin } from '../../../store/features/admin/adminAuthSlice';

const FooterNav = () => {
    const user = useSelector(state => state.auth.user);
    const admin = useSelector(state => state.adminAuth.admin);
    const dispatch = useDispatch();
    const location = useLocation();

    // State for Auth Menu (Guest User)
    const [isAuthMenuOpen, setIsAuthMenuOpen] = useState(false);
    const authMenuRef = useRef(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (authMenuRef.current && !authMenuRef.current.contains(event.target)) {
                setIsAuthMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const links = [
        {
            title: "home",
            icon: "mdi:home",
            path: "/"
        },
        {
            title: "wishlist",
            icon: "material-symbols:favorite",
            path: "/wishlist"
        },
        {
            title: "orders",
            icon: "material-symbols:delivery-truck-speed",
            path: "/orders"
        },
        {
            // Dynamic title based on auth state
            title: user ? (user.isVerified ? "signout" : "account") : "account",
            icon: user ? (user.isVerified ? "solar:logout-2-bold" : "material-symbols:person-rounded") : "material-symbols:person-rounded",
            // If user is null, path is irrelevant because we hijack the click, but keeping it for structure
            path: user ? (user.isVerified ? "" : "/account/verify") : "/account/signin"
        },
        {
            title: "contact",
            icon: "mingcute:message-4-fill",
            path: "/contact"
        },
    ];

    const adminLinks = [
        { title: "users", icon: "iconamoon:profile", path: "/admin/users" },
        { title: "products", icon: "iconamoon:badge", path: "/admin/products" },
        { title: "orders", icon: "iconamoon:delivery", path: "/admin/orders" },
        { title: "dashboard", icon: "iconamoon:category", path: "/admin/dashboard" },
        { title: "bags", icon: "iconamoon:shopping-bag", path: "/admin/bags" },
        { title: "wishlists", icon: "iconamoon:heart", path: "/admin/wishlists" },
    ];

    const handleLogout = async () => {
        const res = await dispatch(logoutUser());
        if (res?.meta?.requestStatus === "fulfilled") {
            toast.success("Signed Out", toastControls);
            window.location.reload();
        } else {
            toast.error(res?.payload?.message || "Failed to Sign Out!", toastControls);
        }
    };

    const handleAdminLogout = async () => {
        const res = await dispatch(logoutAdmin());
        if (res?.meta?.requestStatus === "fulfilled") {
            toast.success("Signed Out", toastControls);
        } else {
            toast.error(res?.payload?.message || "Failed to Sign Out!", toastControls);
        }
    };

    return (
        <div className='w-full sticky bottom-0 left-0 border-t-[0.5px] border-zinc-700 z-999 print:hidden lg:hidden' id='footer-nav'>
            <nav className={`w-full flex justify-between items-center ${admin ? "px-3" : "px-5"} bg-black py-3`}>
                
                {/* USER NAVIGATION */}
                {!admin && links.map(({ title, icon, path }) => {
                    
                    // Case 1: Sign Out Button (Verified User)
                    if (title === "signout") {
                        return (
                            <div onClick={handleLogout} key={`${title}-footer-nav-key`} className="signout-btn flex flex-col items-center gap-1 cursor-pointer text-zinc-400 hover:text-white transition-colors">
                                <Icon className='text-2xl' icon={icon} />
                                <span className='text-[0.65rem] capitalize font-medium'>{title}</span>
                            </div>
                        );
                    }

                    // Case 2: Account Button (Guest / Not Logged In) -> SHOW DROPDOWN
                    if (title === "account" && !user) {
                        return (
                            <div 
                                key="guest-account-menu" 
                                className="relative flex flex-col items-center gap-1 cursor-pointer text-zinc-400 hover:text-white transition-colors"
                                ref={authMenuRef}
                                onClick={() => setIsAuthMenuOpen(!isAuthMenuOpen)}
                            >
                                <Icon className={`text-2xl ${isAuthMenuOpen ? "text-white" : ""}`} icon={icon} />
                                <span className={`text-[0.65rem] capitalize font-medium ${isAuthMenuOpen ? "text-white" : ""}`}>{title}</span>

                                {/* DROPDOWN MENU (Pops Up) */}
                                {isAuthMenuOpen && (
                                    <div className="absolute bottom-full mb-4 right-[-50%] translate-x-[-20%] w-48 bg-zinc-900 border border-zinc-800 rounded-md shadow-2xl overflow-hidden animate-in slide-in-from-bottom-2 fade-in duration-200 origin-bottom-right">
                                        <Link 
                                            to="/account/signin" 
                                            className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-800 text-sm text-zinc-300 hover:text-white transition-colors border-b border-zinc-800"
                                        >
                                            <Icon icon="solar:login-3-bold" className="text-lg" />
                                            Login / SignUp
                                        </Link>
                                        <Link 
                                            to="/admin/signin" 
                                            className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-800 text-sm text-zinc-300 hover:text-white transition-colors"
                                        >
                                            <Icon icon="solar:shield-user-outline" className="text-lg" />
                                            Member Login
                                        </Link>
                                        
                                        {/* Little Arrow pointing down */}
                                        <div className="absolute -bottom-1.5 right-[25%] w-3 h-3 bg-zinc-900 border-r border-b border-zinc-800 rotate-45"></div>
                                    </div>
                                )}
                            </div>
                        );
                    }

                    // Case 3: Standard Link
                    const isActive = location.pathname === path;
                    return (
                        <Link 
                            key={`${title}-footer-nav-key`} 
                            className={`flex flex-col items-center gap-1 transition-colors ${isActive ? "text-white" : "text-zinc-400 hover:text-zinc-200"}`} 
                            to={path}
                        >
                            <Icon className='text-2xl' icon={icon} />
                            <span className='text-[0.65rem] capitalize font-medium'>{title}</span>
                        </Link>
                    );
                })}

                {/* ADMIN NAVIGATION */}
                {admin && adminLinks.map(({ title, icon, path }) => {
                    const isActive = location.pathname === path;
                    return (
                        <Link 
                            key={`${title}-footer-nav-key`} 
                            className={`flex flex-col items-center gap-1 transition-colors ${isActive ? "text-white" : "text-zinc-400 hover:text-zinc-200"}`} 
                            to={path}
                        >
                            <Icon className='text-xl' icon={icon} />
                            <span className='text-[0.6rem] capitalize font-medium'>{title}</span>
                        </Link>
                    )
                })}

                {/* Admin Logout */}
                {admin && (
                    <div onClick={handleAdminLogout} key={`admin-logout-footer-nav-key`} className='flex flex-col items-center gap-1 cursor-pointer text-red-400 hover:text-red-300 transition-colors'>
                        <Icon className='text-xl' icon="solar:logout-2-outline" />
                        <span className='text-[0.6rem] capitalize font-medium'>Signout</span>
                    </div>
                )}
            </nav>
        </div>
    )
}

export default FooterNav;