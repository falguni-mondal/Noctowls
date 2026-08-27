import React, { useState, useEffect } from "react";

const phrases = ["PHASE 00", "COMING SOON"];
const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!<>-_\\/[]{}—=+*^?#";

// 1. Accept the 'introFinished' prop from the master component
const PhaseHeroComingSoon = ({ introFinished }) => {
  const [displayText, setDisplayText] = useState(phrases[0]);

  // --- CYPHER SCRAMBLE ANIMATION LOGIC ---
  useEffect(() => {
    if (!introFinished) return;

    let isActive = true;
    let currentIndex = 0;

    const triggerAnimation = async () => {
      while (isActive) {
        // Hold the fully resolved word for exactly 5 seconds
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
  }, [introFinished]); // 3. Add introFinished to the dependency array

  return (
    <div className="parallax-container relative w-full pt-32 pb-10 px-5 lg:px-10 max-w-[1600px] mx-auto z-30 flex flex-col items-center pointer-events-none">
      
      {/* THE MASSIVE MOON SHAPE */}
      <div className="moon-canvas absolute top-0 left-1/2 -translate-x-1/2 w-[200vw] md:w-[150vw] xl:w-[120vw] h-[65vh] md:h-[75vh] rounded-b-[50%] overflow-hidden z-0 
        shadow-[0_10px_40px_rgba(255,255,255,0.4),_0_40px_120px_rgba(37,99,235,0.4),_0_80px_250px_rgba(30,58,138,0.5)]">
        
        <div className="absolute inset-0 bg-zinc-100"></div>
        
        <img 
          src="/moon.png" 
          alt="Phase 00 Lunar Surface" 
          className="absolute inset-0 w-full h-full object-cover object-center opacity-90 select-none pointer-events-none"
        />

        <div className="absolute inset-0 shadow-[inset_0_-10px_30px_rgba(255,255,255,0.6),_inset_0_-40px_80px_rgba(0,0,0,0.5)] rounded-b-[50%] pointer-events-none"></div>
      </div>

      {/* HERO TEXT */}
      <div className="parallax-text-top relative z-10 flex flex-col items-center text-center mt-10">
        <p className="hero-element phase-txt text-zinc-800 font-bold tracking-[0.5em] uppercase text-sm md:text-lg mb-4 drop-shadow-[0_2px_10px_rgba(255,255,255,0.8)]">
          New Moon
        </p>
        
        <h1 className="hero-element phase-txt text-red-600 text-[10vw] sm:text-5xl md:text-6xl lg:text-[110px] xl:text-[120px] 2xl:text-[140px] whitespace-nowrap tracking-widest uppercase leading-none drop-shadow-md">
          {displayText}
        </h1>
      </div>

      {/* Bottom Text */}
      <div className="parallax-text-bottom relative z-10 mix-blend-difference flex flex-col items-center text-center mt-10 mb-32 h-[15vh]">
        <p className="hero-element max-w-xl text-white text-sm md:text-base font-medium">
          The void before the light. Phase 00 represents our prototype
          era—minimalist, raw, and foundational. Everything begins in the dark.
        </p>
      </div>
    </div>
  );
};

export default PhaseHeroComingSoon;