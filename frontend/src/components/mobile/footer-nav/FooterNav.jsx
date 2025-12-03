import { Icon } from '@iconify/react/dist/iconify.js'
import React from 'react'
import { Link } from 'react-router-dom'

const FooterNav = () => {
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
            title: "account",
            icon: "material-symbols:person-rounded",
            path: "/account"
        },
        {
            title: "contact",
            icon: "mingcute:message-4-fill",
            path: "/contact"
        },
    ]
  return (
    <div className='w-full sticky bottom-0 left-0 border-t-[0.5px] border-zinc-700 z-999' id='footer-nav'>
        <nav className='w-full flex justify-between items-center px-5 bg-black py-3'>
            {
                links.map(({title, icon, path}) => (
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