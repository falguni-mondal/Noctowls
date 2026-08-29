import { Icon } from '@iconify/react/dist/iconify.js';
import { NavLink, useLocation } from 'react-router-dom';

const TopNavMenu = ({ showNav, setShowNav }) => {
    const location = useLocation();
    
    const links = [
        { title: "Home", link: "/", isPhase: false },
        { title: "Anime", link: "/collection/deskmat/anime", isPhase: false },
        { title: "Marvel", link: "/collection/deskmat/marvel", isPhase: false },
        { title: "Games", link: "/collection/deskmat/games", isPhase: false },
        { title: "Grid & Lines", link: "/collection/deskmat/grid-and-lines", isPhase: false },
        { title: "Japanese Art", link: "/collection/deskmat/japanese-art", isPhase: false },
        { title: "Fantasy", link: "/collection/deskmat/fantasy", isPhase: false },
        { title: "phase 00", link: "/series/moon/00", isPhase: true },
        { title: "contact", link: "/contact", isPhase: false },
    ];

    return (
        <div className={`fixed inset-0 top-0 left-0 bg-black pt-5 z-[999] overflow-y-auto ${showNav ? "" : "hidden"} print:hidden`}>
            
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
            <ul className='flex flex-col text-xl font-medium pt-6 pb-20'>
                {links.map(({ title, link, isPhase }) => {
                    const isActive = location.pathname === link;
                    
                    return (
                        <li key={`${title}-top-navmenu-item`} className="relative group">
                            
                            {/* Visual Layer */}
                            <div 
                                className={`px-5 py-3 transition-colors pointer-events-none ${
                                    isActive && !isPhase 
                                    ? "bg-red-600 text-white" 
                                    : isActive && isPhase
                                    ? "bg-zinc-900 border-l-4 border-red-600" 
                                    : "text-zinc-300 group-hover:text-white group-hover:bg-white/5"
                                }`}
                            >
                                {/* Apply the shine class if it's the Phase link */}
                                <span className={`${isPhase ? "phase-shine phase-txt uppercase" : "capitalize"} ${isActive && !isPhase ? "text-white" : ""}`}>
                                    {title}
                                </span>
                            </div>

                            {/* Interaction Layer (Actual Link) */}
                            <NavLink 
                                to={link} 
                                onClick={() => setShowNav(false)} 
                                className="absolute inset-0 z-10"
                            />
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

export default TopNavMenu;