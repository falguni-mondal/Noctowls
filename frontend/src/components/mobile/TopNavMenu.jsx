import { Icon } from '@iconify/react/dist/iconify.js';
import { NavLink, useLocation } from 'react-router-dom';

const TopNavMenu = ({ showNav, setShowNav }) => {
    const location = useLocation();
    
    const links = [
        {
            title: "home",
            link: "/",
        },
        {
            title: "catalog",
            link: "/catalog",
        },
        {
            title: "contact",
            link: "/contact",
        },
    ];

    return (
        <div className={`fixed inset-0 top-0 left-0 bg-black pt-5 z-999 ${showNav ? "" : "hidden"} print:hidden`}>
            
            {/* Close Button Container */}
            <div className="close-btn-container px-5 flex justify-end">
                <div className="relative w-10 aspect-square">
                    {/* Visual Layer */}
                    <div className='w-full h-full rounded-full bg-zinc-100 text-black flex justify-center items-center text-xl pointer-events-none'>
                        <Icon icon="material-symbols:close" />
                    </div>
                    {/* Interaction Layer */}
                    <span 
                        onClick={() => setShowNav(false)} 
                        className='absolute inset-0 z-10 cursor-pointer rounded-full' 
                    />
                </div>
            </div>

            {/* Navigation List */}
            <ul className='flex flex-col text-xl font-medium pt-10'>
                {links.map(({ title, link }) => (
                    <li key={`${title}-top-navmenu-item`} className="relative group">
                        
                        {/* Visual Layer */}
                        <div 
                            className={`px-5 py-2 capitalize transition-colors pointer-events-none ${
                                location.pathname === link 
                                ? "bg-red-600 text-white" 
                                : "text-zinc-300 group-hover:text-white group-hover:bg-white/5"
                            }`}
                        >
                            {title}
                        </div>

                        {/* Interaction Layer (Actual Link) */}
                        <NavLink 
                            to={link} 
                            onClick={() => setShowNav(false)} 
                            className="absolute inset-0 z-10"
                        />
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default TopNavMenu;