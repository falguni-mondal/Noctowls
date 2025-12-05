import { Icon } from '@iconify/react/dist/iconify.js'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { logoutUser } from '../../../store/features/user/authSlice'
import { toast } from 'react-toastify'
import toastControls from '../../../utils/global/toastControls'
import { logoutAdmin } from '../../../store/features/admin/adminAuthSlice'

const FooterNav = () => {
    const user = useSelector(state => state.auth.user);
    const admin = useSelector(state => state.adminAuth.admin);
    const dispatch = useDispatch();

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
            title: user ? user.isVerified ? "signout" : "account" : "account",
            icon: user ? user.isVerified ? "solar:logout-2-bold" : "material-symbols:person-rounded" : "material-symbols:person-rounded",
            path: user ? user.isVerified ? "" : "/account/verify" : "/account/signin"
        },
        {
            title: "contact",
            icon: "mingcute:message-4-fill",
            path: "/contact"
        },
    ]

    const adminLinks = [
        {
            title: "users",
            icon: "iconamoon:profile",
            path: "/admin/users",
        },
        {
            title: "products",
            icon: "iconamoon:badge",
            path: "/admin/products",
        },
        {
            title: "orders",
            icon: "iconamoon:delivery",
            path: "/admin/orders",
        },
        {
            title: "dashboard",
            icon: "iconamoon:category",
            path: "/admin/dashboard",
        },
        {
            title: "bags",
            icon: "iconamoon:shopping-bag",
            path: "/admin/bags",
        },
        {
            title: "wishlists",
            icon: "iconamoon:heart",
            path: "/admin/wishlists",
        },
    ]

    const handleLogout = async () => {
        const res = await dispatch(logoutUser());

        if (res?.meta?.requestStatus === "fulfilled") {
            toast.success("Signed Out", toastControls);
        } else {
            toast.error(res?.payload?.message || "Failed to Sign Out!", toastControls);
        }
    }

    const handleAdminLogout = async () => {
        const res = await dispatch(logoutAdmin());

        if (res?.meta?.requestStatus === "fulfilled") {
            toast.success("Signed Out", toastControls);
        } else {
            toast.error(res?.payload?.message || "Failed to Sign Out!", toastControls);
        }
    }

    return (
        <div className='w-full sticky bottom-0 left-0 border-t-[0.5px] border-zinc-700 z-999' id='footer-nav'>
            <nav className={`w-full flex justify-between items-center ${admin ? "px-3" : "px-5"} bg-black py-3`}>
                {
                    !admin &&
                    links.map(({ title, icon, path }) => (
                        title === "signout" ?
                            <div onClick={handleLogout} key={`${title}-footer-nav-key`} className="signout-btn flex flex-col items-center gap-1">
                                <Icon className='text-2xl' icon={icon} />
                                <span className='text-xs capitalize'>{title}</span>
                            </div>
                            :
                            <Link key={`${title}-footer-nav-key`} className='flex flex-col items-center gap-1' to={path}>
                                <Icon className='text-2xl' icon={icon} />
                                <span className='text-xs capitalize'>{title}</span>
                            </Link>
                    ))
                }
                {
                    admin &&
                    adminLinks.map(({ title, icon, path }) => (
                        <Link key={`${title}-footer-nav-key`} className='flex flex-col items-center gap-1' to={path}>
                            <Icon className='text-xl' icon={icon} />
                            <span className='text-[0.6rem] capitalize'>{title}</span>
                        </Link>
                    ))
                }
                {
                    admin &&
                    <div onClick={handleAdminLogout} key={`admin-logout-footer-nav-key`} className='flex flex-col items-center gap-1'>
                        <Icon className='text-xl' icon="solar:logout-2-outline" />
                        <span className='text-[0.6rem] capitalize'>Signout</span>
                    </div>
                }
            </nav>
        </div>
    )
}

export default FooterNav