import React from "react";

const PhaseHero = ({ currentPhase }) => {
  return (
    <div className="relative w-full pt-32 pb-10 px-5 lg:px-10 max-w-[1600px] mx-auto z-30 flex flex-col items-center pointer-events-none">
      
      {/* THE MASSIVE MOON SHAPE */}
      <div className="moon-canvas absolute top-0 left-1/2 -translate-x-1/2 w-[200vw] md:w-[150vw] xl:w-[120vw] h-[65vh] md:h-[75vh] rounded-b-[50%] overflow-hidden z-0 
        shadow-[0_10px_40px_rgba(255,255,255,0.4),_0_40px_120px_rgba(37,99,235,0.4),_0_80px_250px_rgba(30,58,138,0.5)]">
        
        <div className="absolute inset-0 bg-zinc-100"></div>
        
        <img 
          src="/moon.png" 
          alt="Lunar Surface" 
          className="absolute inset-0 w-full h-full object-cover object-center opacity-90 select-none pointer-events-none"
        />

        <div className="absolute inset-0 shadow-[inset_0_-10px_30px_rgba(255,255,255,0.6),_inset_0_-40px_80px_rgba(0,0,0,0.5)] rounded-b-[50%] pointer-events-none"></div>
      </div>

      {/* HERO TEXT WRAPPER */}
      <div className="relative z-10 flex flex-col items-center text-center mt-10 w-full">
        
        <div className="hero-text-element opacity-0 translate-y-10">
          {/* Dynamic Pre-Heading */}
          <p className="phase-txt text-zinc-400 font-medium tracking-[0.8em] uppercase text-sm md:text-lg mb-4 drop-shadow-md transition-all duration-500">
            {currentPhase.name}
          </p>
        </div>
        
        <div className="hero-text-element opacity-0 translate-y-10">
          {/* Dynamic Main Heading */}
          <h1 className="phase-txt text-red-600 text-[10vw] sm:text-5xl md:text-6xl lg:text-[110px] xl:text-[120px] 2xl:text-[140px] whitespace-nowrap tracking-widest uppercase leading-none drop-shadow-md transition-all duration-500">
            PHASE {currentPhase.id}
          </h1>
        </div>
        
        <div className="hero-text-element opacity-0 translate-y-10 mt-10 max-w-2xl">
          {/* Dynamic Lore Paragraph */}
          <p className="text-zinc-400 text-sm md:text-base lg:text-lg font-medium leading-relaxed transition-all duration-500">
            {currentPhase.lore}
          </p>
        </div>

      </div>
    </div>
  );
};

export default PhaseHero;