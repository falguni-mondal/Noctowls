import mobile_video from "../../../assets/videos/mobile_hero_video.webm";
import website_video from "../../../assets/videos/website_hero_video.webm";

// TODO: Import your specific tablet and desktop videos here.
const tablet_video = mobile_video; 
const desktop_video = website_video; 

const Hero = () => {
  return (
    <section className='w-full h-[95dvh] lg:h-[72dvh] overflow-hidden' id='hero-section'>
        
        {/* --- MOBILE VIDEO (0px - 767px) --- */}
        {/* Keeps original mobile design. Hidden on tablets and up. */}
        <video 
            className='w-full h-full object-cover md:hidden' 
            src={mobile_video} 
            muted 
            autoPlay 
            loop 
            playsInline 
        />

        {/* --- TABLET VIDEO (768px - 1199px) --- */}
        {/* Visible on medium screens, hidden on mobile and large desktops. */}
        <video 
            className='w-full h-full object-cover hidden md:block lg:hidden' 
            src={tablet_video} 
            muted 
            autoPlay 
            loop 
            playsInline 
        />

        {/* --- DESKTOP VIDEO (1200px+) --- */}
        {/* Visible only on large screens. */}
        <video 
            className='w-full h-full object-cover hidden lg:block' 
            src={desktop_video} 
            muted 
            autoPlay 
            loop 
            playsInline 
        />

    </section>
  )
}

export default Hero;