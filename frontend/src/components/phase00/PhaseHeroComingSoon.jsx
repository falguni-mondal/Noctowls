import React, { useState, useEffect } from "react";

const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!<>-_\\/[]{}—=+*^?#";

const PhaseHeroComingSoon = ({ introFinished, currentPhase }) => {
  // 1. Dynamically build the scrambling phrases based on the current active phase
  const phrases = [`PHASE ${currentPhase.id}`, "COMING SOON"];
  
  const [displayText, setDisplayText] = useState(phrases[0]);

  // --- CYPHER SCRAMBLE ANIMATION LOGIC ---
  useEffect(() => {
    if (!introFinished) return;

    let isActive = true;
    let currentIndex = 0;

    // Reset the display text instantly when the user clicks a new phase in the navigator
    setDisplayText(phrases[0]);

    const triggerAnimation = async () => {
      while (isActive) {
        // Hold the fully resolved word for exactly 3 seconds
        await new Promise((resolve) => setTimeout(resolve, 3000));
        if (!isActive) break;

        const nextIndex = (currentIndex + 1) % phrases.length;
        const newWord = phrases[nextIndex];
        const oldWord = phrases[currentIndex];
        
        const maxLength = Math.max(oldWord.length, newWord.length);

        const resolveIterations = Array.from({ length: maxLength }).map(
          () => Math.floor(Math.random() * 40)
        );
        const maxResolve = Math.max(...resolveIterations);

        for (let iter = 0; iter <= maxResolve; iter++) {
          if (!isActive) break;

          let currentString = "";
          for (let i = 0; i < maxLength; i++) {
            if (iter >= resolveIterations[i]) {
              if (i < newWord.length) {
                currentString += newWord[i];
              }
            } else {
              if (newWord[i] === " " && i < newWord.length) {
                currentString += " ";
              } else {
                currentString += chars[Math.floor(Math.random() * chars.length)];
              }
            }
          }
          
          setDisplayText(currentString);
          await new Promise((resolve) => setTimeout(resolve, 30));
        }

        currentIndex = nextIndex;
      }
    };

    triggerAnimation();

    return () => {
      isActive = false;
    };
  }, [introFinished, currentPhase.id]); // Re-trigger the scramble effect if the URL changes

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
          {/* 2. Dynamic Pre-Heading (e.g. WAXING CRESCENT) */}
          <p className="phase-txt text-zinc-400 font-medium tracking-[0.8em] uppercase text-sm md:text-lg mb-4 drop-shadow-md transition-all duration-500">
            {currentPhase.name}
          </p>
        </div>
        
        <div className="hero-text-element opacity-0 translate-y-10">
          {/* Dynamic Scrambling Heading */}
          <h1 className="phase-txt text-red-600 text-[10vw] sm:text-5xl md:text-6xl lg:text-[110px] xl:text-[120px] 2xl:text-[140px] whitespace-nowrap tracking-widest uppercase leading-none drop-shadow-md">
            {displayText}
          </h1>
        </div>
        
        <div className="hero-text-element opacity-0 translate-y-10 mt-10 max-w-2xl">
          {/* 3. Dynamic Lore Paragraph */}
          <p className="text-zinc-400 text-sm md:text-base lg:text-lg font-medium leading-relaxed transition-all duration-500">
            {currentPhase.lore}
          </p>
        </div>

      </div>
    </div>
  );
};

export default PhaseHeroComingSoon;