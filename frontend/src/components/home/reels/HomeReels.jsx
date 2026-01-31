import { useState, useRef, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { Icon } from "@iconify/react";

// --- IMPORT YOUR LOCAL VIDEOS HERE ---
import video1 from "../../../assets/reels/reel1.mp4";
import video2 from "../../../assets/reels/reel2.mp4";
import video3 from "../../../assets/reels/reel3.mp4";
import video4 from "../../../assets/reels/reel4.mp4";
import video5 from "../../../assets/reels/reel5.mp4";
import video6 from "../../../assets/reels/reel6.mp4";
import video7 from "../../../assets/reels/reel7.mp4";
import video8 from "../../../assets/reels/reel8.mp4";
import video9 from "../../../assets/reels/reel9.mp4";
import video10 from "../../../assets/reels/reel10.mp4";
import video11 from "../../../assets/reels/reel11.mp4";
import video12 from "../../../assets/reels/reel12.mp4";
import video13 from "../../../assets/reels/reel13.mp4";
import video14 from "../../../assets/reels/reel14.mp4";
import video15 from "../../../assets/reels/reel15.mp4";

const REELS_DATA = [
  { id: 1, videoUrl: video1 },
  { id: 2, videoUrl: video2 },
  { id: 3, videoUrl: video3 },
  { id: 4, videoUrl: video4 },
  { id: 5, videoUrl: video5 },
  { id: 6, videoUrl: video6 },
  { id: 7, videoUrl: video7 },
  { id: 8, videoUrl: video8 },
  { id: 9, videoUrl: video9 },
  { id: 10, videoUrl: video10 },
  { id: 11, videoUrl: video11 },
  { id: 12, videoUrl: video12 },
  { id: 13, videoUrl: video13 },
  { id: 14, videoUrl: video14 },
  { id: 15, videoUrl: video15 },
];

const HomeReels = () => {
  // State to track which reel is currently active
  const [currentPlayingId, setCurrentPlayingId] = useState(null);

  return (
    <section className="home-reels-section pb-28 w-full relative border-t border-zinc-900/50 pt-10">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 mb-8 flex items-center justify-between">
        <h2 className="text-white text-xl md:text-2xl font-black uppercase tracking-wide pl-2 border-l-4 border-red-600 flex items-center gap-3">
          Featured Reels <Icon icon="solar:clapperboard-text-bold" className="text-red-600" />
        </h2>
      </div>

      <div className="w-full pl-4 md:pl-8">
        <Swiper
          spaceBetween={16}
          slidesPerView={1.5}
          grabCursor={true}
          loop={true}
          breakpoints={{
            480: { slidesPerView: 2.2, spaceBetween: 16 },
            768: { slidesPerView: 3.5, spaceBetween: 20 },
            1024: { slidesPerView: 4.5, spaceBetween: 24 },
            1440: { slidesPerView: 5.5, spaceBetween: 24 },
          }}
          className="reels-swiper overflow-visible pb-4"
        >
          {REELS_DATA.map((reel) => (
            <SwiperSlide key={reel.id} className="h-auto">
              <ReelCard 
                reel={reel} 
                isCurrent={currentPlayingId === reel.id} // Is this the one playing?
                onPlay={() => setCurrentPlayingId(reel.id)} // Function to set this as playing
                onPause={() => setCurrentPlayingId(null)} // Function to clear playing state
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
};

// ==================== INDIVIDUAL REEL CARD ====================
const ReelCard = ({ reel, isCurrent, onPlay, onPause }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Effect: Watch for changes in 'isCurrent'. 
  // If this card is NO LONGER the current one, pause it.
  useEffect(() => {
    if (!isCurrent && isPlaying && videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [isCurrent, isPlaying]);

  const togglePlay = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
      onPause(); // Notify parent that nothing is playing
    } else {
      // Notify parent FIRST to pause others
      onPlay(); 
      
      videoRef.current.muted = false;
      videoRef.current.volume = 1.0;
      
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch((err) => console.error("Playback failed", err));
      }
    }
  };

  return (
    <div 
      className="group relative aspect-9/16 bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-800 shadow-lg hover:shadow-red-900/10 transition-all duration-500 hover:border-red-700/50"
    >
      <video
        ref={videoRef}
        src={reel.videoUrl}
        className="w-full h-full object-cover bg-black"
        playsInline
        loop
        preload="metadata"
        onClick={togglePlay}
        onEnded={() => {
            setIsPlaying(false);
            onPause();
        }}
      />

      <div 
        className={`absolute inset-0 bg-black/20 transition-opacity duration-300 pointer-events-none ${isPlaying ? "opacity-0" : "opacity-100"}`}
      ></div>

      <div 
        className={`absolute inset-0 flex items-center justify-center transition-all duration-300 cursor-pointer z-10
          ${isPlaying ? "opacity-0 hover:opacity-100 bg-black/10" : "opacity-100"}
        `}
        onClick={togglePlay}
      >
        <div className={`
            w-16 h-16 rounded-full flex items-center justify-center text-white shadow-2xl 
            transition-all duration-300 border border-white/20
            ${isPlaying 
                ? "bg-black/40 backdrop-blur-md scale-90" 
                : "bg-white/10 backdrop-blur-md group-hover:scale-110 group-hover:bg-red-600/80 group-hover:border-red-500"}
        `}>
          {isPlaying ? (
            <Icon icon="solar:pause-bold" className="text-2xl" />
          ) : (
            <Icon icon="solar:play-bold" className="text-3xl ml-1" />
          )}
        </div>
      </div>

      <div className={`absolute bottom-0 left-0 w-full h-1/4 bg-linear-to-t from-black/80 to-transparent pointer-events-none transition-opacity duration-300 ${isPlaying ? 'opacity-40' : 'opacity-80'}`}></div>
      
      <div className={`absolute top-4 right-4 bg-black/60 backdrop-blur-md px-2 py-1 rounded-full text-white pointer-events-none transition-all duration-300 ${isPlaying ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"}`}>
         <div className="flex items-center gap-1.5">
            <div className="flex gap-0.5 items-end h-3">
                <div className="w-0.5 bg-red-500 animate-[music-bar_0.5s_ease-in-out_infinite] h-2"></div>
                <div className="w-0.5 bg-red-500 animate-[music-bar_0.7s_ease-in-out_infinite] h-3"></div>
                <div className="w-0.5 bg-red-500 animate-[music-bar_0.4s_ease-in-out_infinite] h-1.5"></div>
            </div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-300">Sound On</span>
         </div>
      </div>
      
      <style>{`
        @keyframes music-bar {
          0%, 100% { height: 4px; }
          50% { height: 12px; }
        }
      `}</style>
    </div>
  );
};

export default HomeReels;