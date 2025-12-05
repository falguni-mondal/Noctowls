import { Link } from 'react-router-dom';
import { Icon } from "@iconify/react";
import Logo from '../../../utils/logo/Logo';
import { useSelector } from 'react-redux';

const Navbar = ({ setShowNav }) => {
    const admin = useSelector(state => state.adminAuth.admin);
    return (
        <header className='sticky top-0 left-0 z-999 bg-black flex justify-between items-center text-2xl w-full py-4 border-t border-zinc-700 px-5' id="mobile-navbar">
            <div onClick={() => setShowNav(true)} className="nav-icon w-[30%]">
                <Icon icon="fluent:navigation-24-regular" />
            </div>
            <div className="logo">
                <Logo width="w-[88px]" />
            </div>
            <nav className="nav-icons flex gap-4 w-[30%]">
                <span>
                    <Icon icon="basil:search-solid" />
                </span>
                <Link to="/admin/account/signin">
                    <Icon icon="material-symbols-light:lock-person-outline" />
                </Link>
                {
                    !admin &&
                    <Link to="/cart">
                        <Icon icon="solar:bag-3-outline" />
                    </Link>
                }
            </nav>
        </header>
    )
}

export default Navbar