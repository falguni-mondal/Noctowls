import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Icon } from "@iconify/react";
import Logo from '../../../utils/logo/Logo';
import { useDispatch, useSelector } from 'react-redux';
import { selectCart } from '../../../store/features/user/cartSlice';
import { logoutUser } from '../../../store/features/user/authSlice';
import { logoutAdmin } from '../../../store/features/admin/adminAuthSlice';
import { toast } from 'react-toastify';
import toastControls from '../../../utils/global/toastControls';

const Navbar = ({
    setShowNav,
    // Receive Search Props
    isSearchOpen,
    setIsSearchOpen,
    query,
    setQuery,
    searchResults,
    searchLoading,
    closeSearch
}) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const user = useSelector(state => state.auth.user);
    const admin = useSelector(state => state.adminAuth.admin);
    const cart = useSelector(selectCart);

    const searchContainerRef = useRef(null);

    // --- DROPDOWN STATE ---
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close menus when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            // User Dropdown
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsUserMenuOpen(false);
            }
            // Search Container
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
                if (!query) closeSearch(); // Use passed handler
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [query, closeSearch]);

    // --- HANDLERS ---
    const handleLogout = async () => {
        const res = await dispatch(logoutUser());
        if (res?.meta?.requestStatus === "fulfilled") {
            toast.success("Signed Out", toastControls);
            navigate("/");
            window.location.reload();
        } else {
            toast.error(res?.payload?.message || "Failed to Sign Out!", toastControls);
        }
    };

    const handleAdminLogout = async () => {
        const res = await dispatch(logoutAdmin());
        if (res?.meta?.requestStatus === "fulfilled") {
            toast.success("Signed Out", toastControls);
            navigate("/admin/signin");
        } else {
            toast.error(res?.payload?.message || "Failed to Sign Out!", toastControls);
        }
    };

    const handleProductClick = (id) => {
        navigate(`/products/${id}`);
        closeSearch(); // Use passed handler
    };

    // Main Navigation Links
    const links = [
        { title: "home", link: "/" },
        { title: "catalog", link: "/catalog" },
        { title: "contact", link: "/contact" },
    ];

    // User Dropdown Links
    const userDropdownLinks = [
        { title: "My Orders", icon: "material-symbols:delivery-truck-speed", path: "/orders" },
        { title: "Wishlist", icon: "material-symbols:favorite", path: "/wishlist" },
        { title: "Contact Us", icon: "mingcute:message-4-fill", path: "/contact" },
    ];

    // Admin Dropdown Links
    const adminDropdownLinks = [
        { title: "Dashboard", icon: "iconamoon:category", path: "/admin/dashboard" },
        { title: "Users", icon: "iconamoon:profile", path: "/admin/users" },
        { title: "Products", icon: "iconamoon:badge", path: "/admin/products" },
        { title: "Orders", icon: "iconamoon:delivery", path: "/admin/orders" },
        { title: "Bag", icon: "solar:bag-3-outline", path: "/admin/bags" },
        { title: "Wishlist", icon: "solar:heart-bold", path: "/admin/wishlists" },
    ];

    return (
        <header className='sticky top-0 left-0 z-999 bg-black flex justify-between items-center text-2xl w-full py-4 border-t border-zinc-700 px-5 print:hidden' id="mobile-navbar">

            {/* Hamburger: Hidden on Large Screens */}
            <div className="nav-icon w-[30%] lg:hidden relative">
                <div className="hamburger w-fit pointer-events-none">
                    <Icon icon="fluent:navigation-24-regular" />
                </div>
                {/* Interaction Fix */}
                <span onClick={() => setShowNav(true)} className="absolute inset-0 z-10 cursor-pointer w-8 h-8" />
            </div>

            {/* Left Side: Logo + Desktop Navigation */}
            <div className="logo flex items-center gap-8 lg:gap-10">
                {/* Logo with Interaction Fix */}
                <div className="relative">
                    <Logo width="w-[88px]" />
                    <Link to="/" className="absolute inset-0 z-10" />
                </div>

                {/* Desktop Navigation Links */}
                <ul className="hidden lg:flex items-center gap-8 text-sm font-medium text-zinc-300">
                    {links.map(({ title, link }) => (
                        <li key={`${title}-desktop-nav`} className="relative group">
                            {/* Visual Representation */}
                            <span className="capitalize group-hover:text-white transition-colors pointer-events-none">
                                {title}
                            </span>
                            
                            {/* Actual NavLink as Overlay */}
                            <NavLink
                                to={link}
                                className={({ isActive }) =>
                                    `absolute inset-0 z-10 ${isActive ? "border-b-2 border-red-600" : ""}`
                                }
                            />
                            {/* Active State visual fix: If active, we usually style the text, but with overlay logic, we can underline or target the sibling. 
                                Alternatively, standard NavLink usage is fine here, but 'relative group' wrapper ensures click area.
                            */}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Right Side: Icons */}
            <nav className="nav-icons flex gap-5 lg:w-auto justify-end items-center static lg:relative w-[30%]">

                {/* --- SEARCH COMPONENT --- */}
                <div
                    ref={searchContainerRef}
                    className={`
                        transition-all duration-300 ease-in-out
                        ${isSearchOpen
                            ? 'absolute inset-0 z-50 flex items-center bg-zinc-950 px-4 w-full lg:static lg:bg-transparent lg:p-0 lg:w-auto'
                            : 'relative w-auto'
                        }
                    `}
                >
                    {isSearchOpen ? (
                        <div className="w-full relative lg:w-[400px] animate-in fade-in zoom-in-95 duration-200">
                            
                            {/* Input Wrapper */}
                            <div className="relative group flex items-center gap-2">
                                <div className="relative w-full">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-red-500 transition-colors pointer-events-none">
                                        <Icon icon="basil:search-solid" className="text-xl" />
                                    </div>

                                    <input
                                        type="text"
                                        autoFocus
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="Search products..."
                                        className="w-full bg-zinc-900 border border-zinc-700 text-zinc-100 text-sm font-medium rounded-full py-3 pl-11 pr-10 focus:outline-none focus:border-red-600/60 focus:ring-1 focus:ring-red-600/60 transition-all placeholder:text-zinc-600 shadow-xl"
                                    />
                                </div>

                                {/* Cancel Button */}
                                <div className="lg:absolute lg:right-3 lg:top-1/2 lg:-translate-y-1/2 relative">
                                    <button 
                                        className="p-1.5 lg:hover:bg-zinc-800 lg:rounded-full transition-all text-sm font-medium text-zinc-400 hover:text-white whitespace-nowrap px-2 pointer-events-none"
                                    >
                                        <span className="lg:hidden">Cancel</span>
                                        <Icon icon="mingcute:close-line" className="hidden lg:block text-lg" />
                                    </button>
                                    <span onClick={closeSearch} className="absolute inset-0 z-10 cursor-pointer" />
                                </div>
                            </div>

                            {/* --- SEARCH RESULTS DROPDOWN --- */}
                            {query && (
                                <div className="absolute top-full left-0 right-0 mt-3 bg-zinc-950/95 backdrop-blur-xl border border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200 lg:w-[120%] lg:right-0 lg:left-auto">
                                    
                                    {!searchLoading && searchResults?.length > 0 && (
                                        <div className="px-4 py-2.5 border-b border-zinc-900 bg-zinc-900/50">
                                            <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Matches found</p>
                                        </div>
                                    )}

                                    <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                                        {searchLoading ? (
                                            <div className="py-12 flex flex-col items-center justify-center text-zinc-500 gap-2">
                                                <Icon icon="line-md:loading-twotone-loop" className="text-3xl text-red-600" />
                                                <span className="text-xs font-medium animate-pulse tracking-wide">Searching...</span>
                                            </div>
                                        ) : searchResults && searchResults.length > 0 ? (
                                            <ul className="divide-y divide-zinc-900/50">
                                                {searchResults.map((product) => (
                                                    <li 
                                                        key={product.id} 
                                                        className="hover:bg-white/5 transition-all duration-200 p-3 flex gap-4 items-center group relative"
                                                    >
                                                        <div className="w-14 h-14 bg-zinc-900 rounded-lg overflow-hidden shrink-0 border border-zinc-800 relative shadow-inner">
                                                            <img src={product.images?.[0]?.url} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                        </div>
                                                        
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex justify-between items-start gap-2">
                                                                <h4 className="text-sm font-semibold text-zinc-200 group-hover:text-red-500 transition-colors truncate">{product.name}</h4>
                                                                <span className="text-xs font-bold text-white bg-zinc-800/80 px-2 py-0.5 rounded-sm shrink-0 whitespace-nowrap">Rs. {product.price}</span>
                                                            </div>
                                                            <p className="text-[11px] text-zinc-500 capitalize mt-0.5 flex items-center gap-1.5">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-zinc-700 group-hover:bg-red-500 transition-colors"></span>
                                                                {product.category}
                                                            </p>
                                                        </div>

                                                        <span onClick={() => handleProductClick(product.id)} className="absolute inset-0 z-10 cursor-pointer" />
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <div className="py-8 px-4 text-center">
                                                <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-3 text-zinc-600">
                                                    <Icon icon="solar:magnifer-broken" className="text-xl" />
                                                </div>
                                                <p className="text-sm text-zinc-300 font-medium">No products found</p>
                                                <p className="text-xs text-zinc-500 mt-1">We couldn't find matches for "{query}"</p>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {!searchLoading && searchResults?.length > 0 && (
                                        <div className="bg-zinc-900/50 border-t border-zinc-900 p-2 text-center hidden md:block">
                                            <p className="text-[10px] text-zinc-600 font-medium">Press enter to see all results</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="relative w-10 h-10">
                            <span className="text-zinc-300 hover:text-white transition-all text-2xl w-full h-full flex items-center justify-center rounded-full hover:bg-zinc-900 active:scale-95 pointer-events-none">
                                <Icon icon="basil:search-solid" />
                            </span>
                            <span onClick={() => setIsSearchOpen(true)} className="absolute inset-0 z-10 cursor-pointer rounded-full" />
                        </div>
                    )}
                </div>

                {/* --- USER / ADMIN DROPDOWN MENU --- */}
                <div className={`hidden lg:block relative ${isSearchOpen ? 'hidden lg:block' : ''}`} ref={dropdownRef}>
                    <div className="relative">
                        <div className="cursor-pointer hover:text-zinc-300 transition-colors flex items-center pointer-events-none">
                            <Icon icon={admin ? "solar:shield-user-outline" : "iconamoon:profile-light"} className="text-2xl" />
                        </div>
                        <span onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="absolute inset-0 z-10 cursor-pointer" />
                    </div>

                    {isUserMenuOpen && (
                        <div className="absolute top-full right-0 mt-3 w-56 bg-zinc-950 border border-zinc-800 rounded-md shadow-xl py-2 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                            {/* User Links */}
                            {!admin && (
                                <>
                                    <div className="px-4 py-2 border-b border-zinc-800 mb-1">
                                        <p className="text-xs text-zinc-500 font-medium">Hello,</p>
                                        <p className="text-sm font-bold text-white truncate">{`${user ? user.name : "Guest"}`}</p>
                                    </div>
                                    {userDropdownLinks.map((item) => (
                                        <div key={item.title} className="relative">
                                            <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-800 text-sm text-zinc-300 hover:text-white transition-colors pointer-events-none">
                                                <Icon icon={item.icon} className="text-lg" />
                                                {item.title}
                                            </div>
                                            <Link to={item.path} onClick={() => setIsUserMenuOpen(false)} className="absolute inset-0 z-10" />
                                        </div>
                                    ))}
                                    {
                                        !user &&
                                        <>
                                            <div className="relative">
                                                <div className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-900 text-sm text-zinc-300 hover:text-white transition-colors pointer-events-none">
                                                    <Icon icon="solar:login-3-bold" className="text-lg" />
                                                    Login / Sign Up
                                                </div>
                                                <Link to="/account/signin" onClick={() => setIsUserMenuOpen(false)} className="absolute inset-0 z-10" />
                                            </div>
                                            <div className="relative border-t border-zinc-900">
                                                <div className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-900 text-sm text-zinc-300 hover:text-white transition-colors pointer-events-none">
                                                    <Icon icon="solar:shield-user-outline" className="text-lg" />
                                                    Members
                                                </div>
                                                <Link to="/admin/signin" onClick={() => setIsUserMenuOpen(false)} className="absolute inset-0 z-10" />
                                            </div>
                                        </>
                                    }
                                    {
                                        user &&
                                        <div className="border-t border-zinc-800 mt-1 pt-1 relative">
                                            <div className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-900/20 text-sm text-red-400 hover:text-red-300 transition-colors text-left pointer-events-none">
                                                <Icon icon="solar:logout-2-bold" className="text-lg" />
                                                Sign Out
                                            </div>
                                            <span onClick={handleLogout} className="absolute inset-0 z-10 cursor-pointer" />
                                        </div>
                                    }
                                </>
                            )}

                            {/* Admin Links */}
                            {admin && (
                                <>
                                    <div className="px-4 py-2 border-b border-zinc-800 mb-1">
                                        <p className="text-xs text-red-500 font-bold uppercase tracking-wider">Admin Panel</p>
                                    </div>
                                    {adminDropdownLinks.map((item) => (
                                        <div key={item.title} className="relative">
                                            <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-800 text-sm text-zinc-300 hover:text-white transition-colors pointer-events-none">
                                                <Icon icon={item.icon} className="text-lg" />
                                                {item.title}
                                            </div>
                                            <Link to={item.path} onClick={() => setIsUserMenuOpen(false)} className="absolute inset-0 z-10" />
                                        </div>
                                    ))}
                                    <div className="border-t border-zinc-800 mt-1 pt-1 relative">
                                        <div className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-900/20 text-sm text-red-400 hover:text-red-300 transition-colors text-left pointer-events-none">
                                            <Icon icon="solar:logout-2-bold" className="text-lg" />
                                            Sign Out
                                        </div>
                                        <span onClick={handleAdminLogout} className="absolute inset-0 z-10 cursor-pointer" />
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Cart Icon */}
                {!admin && (
                    <div className="relative">
                        <div className="relative hover:text-zinc-300 transition-colors pointer-events-none">
                            <Icon icon="solar:bag-3-outline" className="text-2xl" />
                            <span className={`${!cart || cart?.summary?.totalQuantity === 0 ? "hidden" : "flex"} absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-red-600 flex justify-center items-center text-white text-[0.65rem] font-bold border border-black`}>
                                {cart?.summary?.totalQuantity || 0}
                            </span>
                        </div>
                        <Link to="/bag" className="absolute inset-0 z-10 cursor-pointer" />
                    </div>
                )}
            </nav>
        </header>
    )
}

export default Navbar;