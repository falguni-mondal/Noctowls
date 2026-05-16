import Marquee from 'react-fast-marquee';

const HomeMarquee = () => {
    const titles = [
        "🔥live now",
        "✨*Get a keychain on every order*",
        "🎊*Buy 2 and get a free anime figure (worth ₹300)*",
        "🎉*Buy 3 and get a free anime-style katana (worth ₹600)*",
    ]
    return (
        <div className='w-full overflow-x-hidden uppercase font-semibold text-sm bg-red-600 text-zinc-100 relative' id='home-marquee'>
            <Marquee speed={60} pauseOnHover gradient={false}>
                {
                    titles.map((title, index) => (
                        // Increased margins for tablet/desktop to utilize screen width better (md:mr-10 lg:mr-16)
                        // Increased vertical padding slightly for larger touch targets/visual balance (md:py-4)
                        <div key={`marquee-item-${index}`} className='flex items-center mr-5 md:mr-10 lg:mr-16 py-1.5 lg:py-2.5'>
                            {/* Spacers adjusted for consistency */}
                            <span className='ml-5 md:ml-2'></span>
                            {title}
                            <span className='mr-5 md:mr-2'></span>
                        </div>
                    ))
                }
            </Marquee>
        </div>
    )
}

export default HomeMarquee;