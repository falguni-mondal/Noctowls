import { Icon } from '@iconify/react/dist/iconify.js';
import React from 'react'
import { NavLink, useLoaderData, useLocation } from 'react-router-dom'

const TopNavMenu = ({showNav, setShowNav}) => {
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
    ]
  return (
    <div className={`fixed inset-0 top-0 left-0 bg-black pt-5 z-999 ${showNav? "" : "hidden"} print:hidden`}>
        <div className="close-btn-container px-5 flex justify-end">
            <span onClick={() => setShowNav(false)} className='w-10 aspect-square rounded-full bg-zinc-100 text-black flex justify-center items-center text-xl'>
                <Icon icon="material-symbols:close" />
            </span>
        </div>
        <ul className='flex flex-col text-xl font-medium pt-10'>
            {
                links.map(({title, link}) => (
                    <NavLink key={`${title}-top-navmenu-item`} onClick={() => setShowNav(false)} className={`${location.pathname === `${link}` ? "bg-red-600" : ""} px-5 py-2 capitalize`} to={`${link}`}>{title}</NavLink>
                ))
            }
        </ul>
    </div>
  )
}

export default TopNavMenu