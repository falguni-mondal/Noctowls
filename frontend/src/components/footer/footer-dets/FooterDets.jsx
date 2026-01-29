import FooterAbout from './FooterAbout'
import FooterLinks from './FooterLinks'

const FooterDets = ({ openSearch }) => {
    return (
        <div className='w-full p-10 flex flex-col lg:flex-row gap-10 lg:gap-24 text-zinc-300 text-sm pb-0 lg:py-0 print:hidden'>
            <FooterAbout />
            <section className='footer-links-section lg:min-w-60'>
                <h3 className='footer-section-heading font-semibold tracking-wider mt-3 capitalize'>quick links</h3>
                <button 
                    onClick={openSearch}
                    className="search-container w-full cursor-pointer text-left"
                >
                    <span className='w-full block mt-2 py-2 px-3 rounded-[3px] border border-zinc-800 outline-0 bg-zinc-900 text-zinc-400 hover:bg-zinc-800 transition-colors'>
                        Search on Noctowls
                    </span>
                </button>
            </section>
            <FooterLinks />
        </div>
    )
}

export default FooterDets;