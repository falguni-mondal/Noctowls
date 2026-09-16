import { Link } from "react-router-dom";
import mobile_video from "../../../assets/videos/mobile_hero_video.webm";
import website_video from "../../../assets/videos/website_hero_video.webm";

// TODO: Import your specific tablet and desktop videos here.
const tablet_video = mobile_video; 
const desktop_video = website_video; 

const Hero = () => {
  return (
    <section className='relative w-full h-[82svh] lg:h-[82svh] overflow-hidden' id='hero-section'>
        
        {/* --- MOBILE VIDEO (0px - 767px) --- */}
        {/* Keeps original mobile design. Hidden on tablets and up. */}
        <video 
          className='absolute inset-0 w-full h-full object-cover md:hidden' 
          src={mobile_video} 
          muted 
          autoPlay 
          loop 
          playsInline 
        />

        {/* --- TABLET VIDEO (768px - 1199px) --- */}
        {/* Visible on medium screens, hidden on mobile and large desktops. */}
        <video 
          className='absolute inset-0 w-full h-full object-cover hidden md:block lg:hidden' 
          src={tablet_video} 
          muted 
          autoPlay 
          loop 
          playsInline 
        />

        {/* --- DESKTOP VIDEO (1200px+) --- */}
        {/* Visible only on large screens. */}
        <video 
          className='absolute inset-0 w-full h-full object-cover hidden lg:block' 
          src={desktop_video} 
          muted 
          autoPlay 
          loop 
          playsInline 
        />

        {/* --- CTA OVERLAY --- */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-end pb-16 md:pb-10 pointer-events-none">
          <Link 
            to="/series/moon/00"
            className="pointer-events-auto px-8 py-3.5 bg-black/30 backdrop-blur-md border border-white/20 text-white text-xs md:text-sm font-bold uppercase tracking-[0.2em] hover:bg-white hover:text-black hover:border-white transition-all duration-500 rounded-[2px]"
          >
            Explore New Moon
          </Link>
        </div>

    </section>
  )
}

export default Hero;