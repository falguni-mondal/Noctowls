import Marquee from 'react-fast-marquee';

const HomeMarquee = () => {
    const titles = [
        "🔥live now",
        "✨*first 150 orders get a keychain*",
        "🎊*buy 2 and get a free anime figure (worth ₹300)*",
        "🎉*buy 3 and get a free anime-style katana (worth ₹600)*",
    ]
    return (
        <div className='w-full overflow-x-hidden uppercase font-semibold text-[0.9rem] lg:text-[1.4rem] bg-red-600 text-zinc-100 relative' id='home-marquee'>
            <Marquee speed={60} pauseOnHover gradient={false}>
                {
                    titles.map(title => (
                        <div className='flex items-center mr-5 py-3'><span className='ml-5'></span>{title}<span className='mr-5'></span></div>
                    ))
                }
            </Marquee>
        </div>
    )
}

export default HomeMarquee