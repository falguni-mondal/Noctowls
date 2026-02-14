import { useState, useRef, useEffect, useCallback, memo } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Virtual } from 'swiper/modules';
import "swiper/css";
import "swiper/css/virtual"; 
import { Icon } from "@iconify/react";

// --- IMPORT YOUR REELS HERE ---
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

// --- IMPORT YOUR THUMBNAILS HERE ---
import thumb1 from "../../../assets/thumb/reel1.jpg";
import thumb2 from "../../../assets/thumb/reel2.jpg";
import thumb3 from "../../../assets/thumb/reel3.jpg";
import thumb4 from "../../../assets/thumb/reel4.jpg";
import thumb5 from "../../../assets/thumb/reel5.jpg";
import thumb6 from "../../../assets/thumb/reel6.jpg";
import thumb7 from "../../../assets/thumb/reel7.jpg";
import thumb8 from "../../../assets/thumb/reel8.jpg";
import thumb9 from "../../../assets/thumb/reel9.jpg";
import thumb10 from "../../../assets/thumb/reel10.jpg";
import thumb11 from "../../../assets/thumb/reel11.jpg";
import thumb12 from "../../../assets/thumb/reel12.jpg";
import thumb13 from "../../../assets/thumb/reel13.jpg";
import thumb14 from "../../../assets/thumb/reel14.jpg";
import thumb15 from "../../../assets/thumb/reel15.jpg";

// [!code ++] IMPORT LOADER GIF
import loadingGif from "../../../assets/loader/loading.gif";

const REELS_DATA = [
  { id: 1, videoUrl: video1, thumbUrl: thumb1 },
  { id: 2, videoUrl: video2, thumbUrl: thumb2 },
  { id: 3, videoUrl: video3, thumbUrl: thumb3 },
  { id: 4, videoUrl: video4, thumbUrl: thumb4 },
  { id: 5, videoUrl: video5, thumbUrl: thumb5 },
  { id: 6, videoUrl: video6, thumbUrl: thumb6 },
  { id: 7, videoUrl: video7, thumbUrl: thumb7 },
  { id: 8, videoUrl: video8, thumbUrl: thumb8 },
  { id: 9, videoUrl: video9, thumbUrl: thumb9 },
  { id: 10, videoUrl: video10, thumbUrl: thumb10 },
  { id: 11, videoUrl: video11, thumbUrl: thumb11 },
  { id: 12, videoUrl: video12, thumbUrl: thumb12 },
  { id: 13, videoUrl: video13, thumbUrl: thumb13 },
  { id: 14, videoUrl: video14, thumbUrl: thumb14 },
  { id: 15, videoUrl: video15, thumbUrl: thumb15 },
];

const HomeReels = () => {
  const [currentPlayingId, setCurrentPlayingId] = useState(null);

  const handlePlay = useCallback((id) => {
    setCurrentPlayingId(id);
  }, []);

  const handlePause = useCallback(() => {
    setCurrentPlayingId(null);
  }, []);

  return (
    <section className="home-reels-section pb-28 w-full relative border-t border-zinc-900/50 pt-10">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 mb-8 flex items-center justify-between">
        <h2 className="text-white text-xl md:text-2xl font-black uppercase tracking-wide pl-2 border-l-4 border-red-600 flex items-center gap-3">
          Featured Reels <Icon icon="solar:clapperboard-text-bold" className="text-red-600" />
        </h2>
      </div>

      <div className="w-full pl-4 md:pl-8">
        <Swiper
          modules={[Virtual]}
          virtual
          spaceBetween={16}
          slidesPerView={1.5}
          grabCursor={true}
          loop={false} 
          breakpoints={{
            480: { slidesPerView: 2.2, spaceBetween: 16 },
            768: { slidesPerView: 3.5, spaceBetween: 20 },
            1024: { slidesPerView: 4.5, spaceBetween: 24 },
            1440: { slidesPerView: 5.5, spaceBetween: 24 },
          }}
          className="reels-swiper overflow-visible pb-4"
        >
          {REELS_DATA.map((reel, index) => (
            <SwiperSlide key={reel.id} virtualIndex={index} className="h-auto">
              <ReelCard 
                reel={reel} 
                isCurrent={currentPlayingId === reel.id} 
                onPlay={handlePlay} 
                onPause={handlePause}
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
};

// ==================== REEL CARD ====================
const ReelCard = memo(({ reel, isCurrent, onPlay, onPause }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  // [!code ++] New state for buffering
  const [isBuffering, setIsBuffering] = useState(false);

  useEffect(() => {
    if (!isCurrent && isPlaying) {
      setIsPlaying(false);
      setIsBuffering(false); // Reset buffer if forced close
    }
  }, [isCurrent, isPlaying]);

  const handleToggle = () => {
    if (isPlaying) {
      // Pause
      setIsPlaying(false);
      setIsBuffering(false);
      onPause();
    } else {
      // Play
      setIsPlaying(true);
      setIsBuffering(true); // [!code ++] Start buffering immediately when we swap to video
      onPlay(reel.id);
    }
  };

  return (
    <div 
      className="group relative aspect-9/16 bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-800 shadow-lg hover:shadow-red-900/10 transition-all duration-500 hover:border-red-700/50"
    >
      {isPlaying ? (
        <video
          src={reel.videoUrl}
          className="w-full h-full object-cover bg-black"
          playsInline={true}
          webkit-playsinline="true"
          autoPlay={true}
          loop
          onClick={handleToggle}
          // [!code ++] Event: Video needs more data (Net slow)
          onWaiting={() => setIsBuffering(true)} 
          // [!code ++] Event: Video is actually playing (Buffer done)
          onPlaying={() => setIsBuffering(false)} 
          onEnded={() => {
             setIsPlaying(false);
             onPause();
          }}
        />
      ) : (
        <img 
          src={reel.thumbUrl}
          alt="Reel Thumbnail"
          className="w-full h-full object-cover bg-black cursor-pointer"
          onClick={handleToggle}
        />
      )}

      {/* --- OVERLAYS --- */}
      
      {/* 1. Darken Overlay (Only when PAUSED) */}
      <div 
        className={`absolute inset-0 bg-black/20 transition-opacity duration-300 pointer-events-none ${isPlaying ? "opacity-0" : "opacity-100"}`}
      ></div>

      {/* 2. Loader Overlay (Only when PLAYING + BUFFERING) */}
      {/* [!code ++] This is your Loader logic adapted for the card */}
      {isPlaying && isBuffering && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-xs">
             <img className='w-8 aspect-square opacity-80' src={loadingGif} alt="loading..." />
        </div>
      )}

      {/* 3. Play Button (Only when NOT PLAYING and NOT BUFFERING) */}
      <div 
        className={`absolute inset-0 flex items-center justify-center transition-all duration-300 cursor-pointer z-10
          ${isPlaying ? "opacity-0 hover:opacity-100 bg-black/10" : "opacity-100"}
          ${isBuffering ? "hidden" : ""} 
        `}
        onClick={handleToggle}
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
});

export default HomeReels;