import mobile_video from "../../../assets/videos/mobile_hero_video.mp4";
const Hero = () => {
  return (
    <section className='w-full h-[85vh]' id='hero-section'>
        <video className='w-full h-full object-cover' src={mobile_video} muted autoPlay loop/>
    </section>
  )
}

export default Hero