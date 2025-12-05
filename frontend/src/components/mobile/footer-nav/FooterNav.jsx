import { Icon } from '@iconify/react/dist/iconify.js'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { logoutUser } from '../../../store/features/user/authSlice'
import { toast } from 'react-toastify'
import toastControls from '../../../utils/global/toastControls'

const FooterNav = () => {
    const user = useSelector(state => state.auth.user);
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
            title: user? user.isVerified ? "signout" : "account" : "account",
            icon: user? user.isVerified ? "solar:logout-2-bold" : "material-symbols:person-rounded" : "material-symbols:person-rounded",
            path: user? user.isVerified? "" : "/account/verify" : "/account/signin"
        },
        {
            title: "contact",
            icon: "mingcute:message-4-fill",
            path: "/contact"
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

  return (
    <div className='w-full sticky bottom-0 left-0 border-t-[0.5px] border-zinc-700 z-999' id='footer-nav'>
        <nav className='w-full flex justify-between items-center px-5 bg-black py-3'>
            {
                links.map(({title, icon, path}) => (
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
        </nav>
    </div>
  )
}

export default FooterNav