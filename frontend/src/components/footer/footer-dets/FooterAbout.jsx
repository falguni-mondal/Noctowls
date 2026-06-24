import React from 'react'

const FooterAbout = () => {
    return (
        <div className="about-company font-medium">
            <div className="company">
                <h2 className='footer-heading uppercase font-semibold tracking-wider text-white'>noctowls</h2>
                <p className="footer-paragraph max-w-72">
                    Noctowls is a creator-first brand crafting premium deskmats and workspace gear.
                </p>
            </div>
            <div className="footer-contact">
                <h3 className='footer-section-heading font-semibold tracking-wider mt-3 capitalize'>contact us</h3>
                <div className='contact-det'>
                    <p>Whatsapp: 8348341116 (Whatsapp Only).</p>
                    <p>Email: help.noctowls@gmail.com</p>
                </div>
            </div>
        </div>
    )
}

export default FooterAbout