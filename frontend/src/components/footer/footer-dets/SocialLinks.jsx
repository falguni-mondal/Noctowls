import { Icon } from '@iconify/react/dist/iconify.js'
import React from 'react'
import { Link } from 'react-router-dom'

const SocialLinks = () => {
    const links = [
        {
            title:"facebook",
            icon: "ic:baseline-facebook",
            link: "https://www.facebook.com/share/1H1oTfrnJf/",
        },
        {
            title:"instagram",
            icon: "ri:instagram-fill",
            link: "https://www.instagram.com/noctowls.mats/",
        },
        {
            title:"youtube",
            icon: "ri:youtube-fill",
            link: "https://www.youtube.com/@techboxhindi",
        },
    ]
    return (
        <ul className='social-links-container w-full flex justify-center items-center gap-6 mt-5'>
            {
                links.map(({ title, icon, link }) => (
                    <li key={`${title}-social-link-key`} className='w-fit text-xl text-white'>
                        <Link to={link}>
                            <Icon icon={icon} />
                        </Link>
                    </li>
                ))
            }
        </ul>
    )
}

export default SocialLinks