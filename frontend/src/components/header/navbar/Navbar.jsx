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
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsUserMenuOpen(false);
            }
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
                if (!query) closeSearch();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [query, closeSearch]);

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
        closeSearch();
    };

    const links = [
        { title: "Anime", link: "/collection/deskmat/anime", isPhase: false },
        { title: "Marvel", link: "/collection/deskmat/marvel", isPhase: false },
        { title: "Games", link: "/collection/deskmat/games", isPhase: false },
        { title: "Grid & Lines", link: "/collection/deskmat/grid-and-lines", isPhase: false },
        { title: "Japanese Art", link: "/collection/deskmat/japanese-art", isPhase: false },
        { title: "Fantasy", link: "/collection/deskmat/fantasy", isPhase: false },
        { title: "phase 00", link: "/series/moon/00", isPhase: true },
        { title: "contact", link: "/contact", isPhase: false },
    ];

    const userDropdownLinks = [
        { title: "My Orders", icon: "material-symbols:delivery-truck-speed", path: "/orders" },
        { title: "Wishlist", icon: "material-symbols:favorite", path: "/wishlist" },
        { title: "Contact Us", icon: "mingcute:message-4-fill", path: "/contact" },
    ];

    const adminDropdownLinks = [
        { title: "Dashboard", icon: "iconamoon:category", path: "/admin/dashboard" },
        { title: "Users", icon: "iconamoon:profile", path: "/admin/users" },
        { title: "Products", icon: "iconamoon:badge", path: "/admin/products" },
        { title: "Orders", icon: "iconamoon:delivery", path: "/admin/orders" },
        { title: "Bag", icon: "solar:bag-3-outline", path: "/admin/bags" },
        { title: "Wishlist", icon: "solar:heart-bold", path: "/admin/wishlists" },
    ];

    return (
        <header className='sticky top-0 left-0 z-[999] bg-[#f4f4f4] shadow-[0_4px_20px_rgba(0,0,0,0.04)] flex justify-between items-center text-2xl w-full py-4 border-b border-zinc-200 px-5 lg:px-10 text-[#0f0f0f] print:hidden' id="mobile-navbar">

            {/* Hamburger: Hidden on Large Screens */}
            <div className="nav-icon w-[30%] lg:hidden relative group active:scale-95 transition-transform duration-200">
                <div className="w-10 h-10 -ml-2 flex items-center justify-center rounded-full text-zinc-500 group-hover:text-[#0f0f0f] group-hover:bg-black/5 transition-all duration-200 pointer-events-none">
                    <Icon icon="fluent:navigation-24-regular" className="text-2xl" />
                </div>
                <span onClick={() => setShowNav(true)} className="absolute inset-0 z-10 cursor-pointer w-10 h-10" />
            </div>

            {/* Left Side: Logo + Desktop Navigation */}
            <div className="logo flex items-center gap-8 lg:gap-10">
                <div className="relative">
                    <Logo width="w-[88px]" />
                    <Link to="/" className="absolute inset-0 z-10" />
                </div>

                <ul className="hidden lg:flex items-center gap-8 text-sm font-medium text-zinc-700">
                    {links.map(({ title, link, isPhase }) => (
                        <li key={`${title}-desktop-nav`} className="relative group">
                            <span className={`transition-colors pointer-events-none ${isPhase ? "phase-shine phase-txt uppercase" : "group-hover:text-[#0f0f0f] capitalize"}`}>
                                {title}
                            </span>
                            <NavLink
                                to={link}
                                className={({ isActive }) =>
                                    `absolute inset-0 z-10 ${isActive ? "border-b-2 border-red-600" : ""}`
                                }
                            />
                        </li>
                    ))}
                    <li className="relative group">
                        <a 
                            href="https://wa.me/+918348341112"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 group-hover:text-[#0f0f0f] transition-colors capitalize"
                        >
                            <Icon icon="uil:whatsapp-alt" className='pointer-events-none text-lg text-green-600'/>
                            <span>Whatsapp</span>
                        </a>
                    </li>
                </ul>
            </div>

            {/* Right Side: Icons */}
            <nav className="nav-icons flex gap-2 md:gap-3 lg:w-auto justify-end items-center static lg:relative w-[30%]">

                {/* --- SEARCH COMPONENT --- */}
                <div
                    ref={searchContainerRef}
                    className={`
                        transition-all duration-300 ease-in-out
                        ${isSearchOpen
                            ? 'absolute inset-0 z-50 flex items-center bg-white px-4 w-full lg:static lg:bg-transparent lg:p-0 lg:w-auto'
                            : 'relative w-auto'
                        }
                    `}
                >
                    {isSearchOpen ? (
                        <div className="w-full relative lg:w-[400px] animate-in fade-in zoom-in-95 duration-200">
                            
                            <div className="relative group flex items-center gap-2">
                                <div className="relative w-full">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-red-500 transition-colors pointer-events-none">
                                        <Icon icon="basil:search-solid" className="text-xl" />
                                    </div>
                                    <input
                                        type="text"
                                        autoFocus
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="Search products..."
                                        className="w-full bg-white border border-zinc-300 text-[#0f0f0f] text-sm font-medium rounded-full py-3 pl-11 pr-10 focus:outline-none focus:border-red-600/60 focus:ring-1 focus:ring-red-600/60 transition-all placeholder:text-zinc-400 shadow-xl"
                                    />
                                </div>

                                <div className="lg:absolute lg:right-2 lg:top-1/2 lg:-translate-y-1/2 relative group active:scale-95 transition-transform duration-200">
                                    <button 
                                        className="w-8 h-8 flex items-center justify-center lg:group-hover:bg-zinc-100 lg:rounded-full transition-all text-zinc-500 group-hover:text-[#0f0f0f] pointer-events-none"
                                    >
                                        <span className="lg:hidden text-sm px-2">Cancel</span>
                                        <Icon icon="mingcute:close-line" className="hidden lg:block text-lg" />
                                    </button>
                                    <span onClick={closeSearch} className="absolute inset-0 z-10 cursor-pointer rounded-full" />
                                </div>
                            </div>

                            {/* --- SEARCH RESULTS DROPDOWN --- */}
                            {query && (
                                <div className="absolute top-full left-0 right-0 mt-3 bg-white/95 backdrop-blur-xl border border-zinc-200 rounded-xl shadow-2xl overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200 lg:w-[120%] lg:right-0 lg:left-auto">
                                    
                                    {!searchLoading && searchResults?.length > 0 && (
                                        <div className="px-4 py-2.5 border-b border-zinc-200 bg-zinc-50">
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
                                            <ul className="divide-y divide-zinc-100">
                                                {searchResults.map((product) => (
                                                    <li 
                                                        key={product.id} 
                                                        className="hover:bg-zinc-50 transition-all duration-200 p-3 flex gap-4 items-center group relative"
                                                    >
                                                        <div className="w-14 h-14 bg-zinc-100 rounded-lg overflow-hidden shrink-0 border border-zinc-200 relative shadow-inner">
                                                            <img src={product.images?.[0]?.url} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                        </div>
                                                        
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex justify-between items-start gap-2">
                                                                <h4 className="text-sm font-semibold text-[#0f0f0f] group-hover:text-red-600 transition-colors truncate">{product.name}</h4>
                                                                <span className="text-xs font-bold text-[#0f0f0f] bg-zinc-100 px-2 py-0.5 rounded-sm shrink-0 whitespace-nowrap">Rs. {product.price}</span>
                                                            </div>
                                                            <p className="text-[11px] text-zinc-500 capitalize mt-0.5 flex items-center gap-1.5">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 group-hover:bg-red-500 transition-colors"></span>
                                                                {product.category}
                                                            </p>
                                                        </div>

                                                        <span onClick={() => handleProductClick(product.id)} className="absolute inset-0 z-10 cursor-pointer" />
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <div className="py-8 px-4 text-center">
                                                <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-3 text-zinc-400">
                                                    <Icon icon="solar:magnifer-broken" className="text-xl" />
                                                </div>
                                                <p className="text-sm text-[#0f0f0f] font-medium">No products found</p>
                                                <p className="text-xs text-zinc-500 mt-1">We couldn't find matches for "{query}"</p>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {!searchLoading && searchResults?.length > 0 && (
                                        <div className="bg-zinc-50 border-t border-zinc-200 p-2 text-center hidden md:block">
                                            <p className="text-[10px] text-zinc-500 font-medium">Press enter to see all results</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="relative w-10 h-10 group active:scale-95 transition-transform duration-200">
                            <span className="w-full h-full flex items-center justify-center rounded-full text-zinc-500 group-hover:text-[#0f0f0f] group-hover:bg-black/5 transition-all duration-200 pointer-events-none text-[22px]">
                                <Icon icon="basil:search-solid" />
                            </span>
                            <span onClick={() => setIsSearchOpen(true)} className="absolute inset-0 z-10 cursor-pointer rounded-full" />
                        </div>
                    )}
                </div>

                {/* --- USER / ADMIN DROPDOWN MENU --- */}
                <div className={`hidden lg:block relative ${isSearchOpen ? 'hidden lg:block' : ''}`} ref={dropdownRef}>
                    <div className="relative w-10 h-10 group active:scale-95 transition-transform duration-200">
                        <div className="w-full h-full flex items-center justify-center rounded-full text-zinc-500 group-hover:text-[#0f0f0f] group-hover:bg-black/5 transition-all duration-200 pointer-events-none text-2xl">
                            <Icon icon={admin ? "solar:shield-user-outline" : "iconamoon:profile-light"} />
                        </div>
                        <span onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="absolute inset-0 z-10 cursor-pointer rounded-full" />
                    </div>

                    {isUserMenuOpen && (
                        <div className="absolute top-full right-0 mt-3 w-56 bg-white border border-zinc-200 rounded-md shadow-xl py-2 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                            {!admin && (
                                <>
                                    <div className="px-4 py-2 border-b border-zinc-200 mb-1">
                                        <p className="text-xs text-zinc-500 font-medium">Hello,</p>
                                        <p className="text-sm font-bold text-[#0f0f0f] truncate">{`${user ? user.name : "Guest"}`}</p>
                                    </div>
                                    {userDropdownLinks.map((item) => (
                                        <div key={item.title} className="relative">
                                            <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-50 text-sm text-zinc-600 hover:text-[#0f0f0f] transition-colors pointer-events-none">
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
                                                <div className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 text-sm text-zinc-600 hover:text-[#0f0f0f] transition-colors pointer-events-none">
                                                    <Icon icon="solar:login-3-bold" className="text-lg" />
                                                    Login / Sign Up
                                                </div>
                                                <Link to="/account/signin" onClick={() => setIsUserMenuOpen(false)} className="absolute inset-0 z-10" />
                                            </div>
                                            <div className="relative border-t border-zinc-200">
                                                <div className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 text-sm text-zinc-600 hover:text-[#0f0f0f] transition-colors pointer-events-none">
                                                    <Icon icon="solar:shield-user-outline" className="text-lg" />
                                                    Members
                                                </div>
                                                <Link to="/admin/signin" onClick={() => setIsUserMenuOpen(false)} className="absolute inset-0 z-10" />
                                            </div>
                                        </>
                                    }
                                    {
                                        user &&
                                        <div className="border-t border-zinc-200 mt-1 pt-1 relative">
                                            <div className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 text-sm text-red-500 hover:text-red-600 transition-colors text-left pointer-events-none">
                                                <Icon icon="solar:logout-2-bold" className="text-lg" />
                                                Sign Out
                                            </div>
                                            <span onClick={handleLogout} className="absolute inset-0 z-10 cursor-pointer" />
                                        </div>
                                    }
                                </>
                            )}

                            {admin && (
                                <>
                                    <div className="px-4 py-2 border-b border-zinc-200 mb-1">
                                        <p className="text-xs text-red-500 font-bold uppercase tracking-wider">Admin Panel</p>
                                    </div>
                                    {adminDropdownLinks.map((item) => (
                                        <div key={item.title} className="relative">
                                            <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-50 text-sm text-zinc-600 hover:text-[#0f0f0f] transition-colors pointer-events-none">
                                                <Icon icon={item.icon} className="text-lg" />
                                                {item.title}
                                            </div>
                                            <Link to={item.path} onClick={() => setIsUserMenuOpen(false)} className="absolute inset-0 z-10" />
                                        </div>
                                    ))}
                                    <div className="border-t border-zinc-200 mt-1 pt-1 relative">
                                        <div className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 text-sm text-red-500 hover:text-red-600 transition-colors text-left pointer-events-none">
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
                    <div className="relative w-10 h-10 group active:scale-95 transition-transform duration-200">
                        <div className="w-full h-full flex items-center justify-center rounded-full text-zinc-500 group-hover:text-[#0f0f0f] group-hover:bg-black/5 transition-all duration-200 pointer-events-none text-2xl relative">
                            <Icon icon="solar:bag-3-outline" />
                            <span className={`${!cart || cart?.summary?.totalQuantity === 0 ? "hidden" : "flex"} absolute top-0 right-0 w-4 h-4 rounded-full bg-red-600 flex justify-center items-center text-white text-[0.65rem] font-bold border-2 border-[#f4f4f4]`}>
                                {cart?.summary?.totalQuantity || 0}
                            </span>
                        </div>
                        <Link to="/bag" className="absolute inset-0 z-10 cursor-pointer rounded-full" />
                    </div>
                )}
            </nav>
        </header>
    )
}

export default Navbar;