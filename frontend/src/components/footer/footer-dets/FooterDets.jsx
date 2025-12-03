import React from 'react'
import FooterAbout from './FooterAbout'
import SearchLink from './SearchLink'
import FooterLinks from './FooterLinks'
import SocialLinks from './SocialLinks'

const FooterDets = () => {
    return (
        <div className='w-full px-10 flex flex-col gap-10 text-zinc-300 text-sm py-10 border-b-[0.5px] border-zinc-700'>
            <FooterAbout />
            <SearchLink />
            <FooterLinks />
            <SocialLinks />
        </div>
    )
}

export default FooterDets