import React from "react";
import { Icon } from "@iconify/react";
import GalaxyBackground from "./GalaxyBackground"; // Adjust the import path as needed

// Exactly 8 phases (00 to 07). 45 degrees apart.
const moonPhases = [
  { id: "00", name: "New Moon", icon: "wi:moon-alt-new" },
  { id: "01", name: "Waxing Crescent", icon: "wi:moon-alt-waxing-crescent-3" },
  { id: "02", name: "First Quarter", icon: "wi:moon-alt-first-quarter" },
  { id: "03", name: "Waxing Gibbous", icon: "wi:moon-alt-waxing-gibbous-3" },
  { id: "04", name: "Full Moon", icon: "wi:moon-alt-full" },
  { id: "05", name: "Waning Gibbous", icon: "wi:moon-alt-waning-gibbous-3" },
  { id: "06", name: "Third Quarter", icon: "wi:moon-alt-third-quarter" },
  { id: "07", name: "Waning Crescent", icon: "wi:moon-alt-waning-crescent-3" },
];

const PhaseIntro = () => {
  return (
    <div className="intro-overlay fixed inset-0 z-[9999] bg-[#000000] flex flex-col items-center justify-end overflow-hidden">
      <GalaxyBackground className="intro-galaxy z-0" />
      <div className="intro-content-wrapper relative z-10 w-full h-full flex flex-col items-center justify-end">
        <div className="flex-1 w-full flex items-center justify-center pt-10">
          <p className="calibrating-text phase-txt text-xl md:text-3xl lg:text-4xl tracking-[0.5em] uppercase animate-pulse drop-shadow-sm">
            NEW MOON
          </p>
        </div>

        <div className="dial-border relative w-full h-[220px] md:h-[350px] overflow-hidden shrink-0 flex justify-center border-t border-zinc-700">
          <div className="absolute top-0 w-[3px] md:w-[4px] h-14 md:h-20 bg-red-600 z-20 shadow-[0_0_20px_rgba(220,38,38,1)] rounded-b-full" />
          
          <div className="dial-wheel dial-border absolute top-0 w-[160vw] md:w-[120vw] xl:w-[100vw] min-w-[800px] aspect-square rounded-full border border-zinc-700">
            {Array.from({ length: 72 }).map((_, i) => (
              <div key={`tick-${i}`} className="absolute top-0 left-1/2 w-[2px] md:w-[3px] -ml-[1px] h-[50%] origin-bottom" style={{ transform: `rotate(${i * 5}deg)` }}>
                <div className={`w-full ${i % 9 === 0 ? "dial-tick-main h-[24px] md:h-[40px] bg-zinc-200" : "dial-tick-sub h-[12px] md:h-[20px] bg-zinc-400"}`} />
              </div>
            ))}

            {moonPhases.map((phase, i) => (
              <div key={`phase-marker-${i}`} className="absolute top-0 left-1/2 w-[2px] md:w-[3px] -ml-[1px] h-[50%] origin-bottom" style={{ transform: `rotate(${i * 45}deg)` }}>
                <div className="absolute top-14 md:top-24 left-1/2 -translate-x-1/2 flex flex-col items-center justify-center w-32 md:w-48">
                  <Icon icon={phase.icon} className={`text-5xl md:text-7xl ${i === 0 ? "text-red-600 drop-shadow-[0_0_15px_rgba(220,38,38,0.8)]" : "dial-text text-zinc-200"}`} />
                  <span className={`phase-txt text-xs md:text-base mt-4 tracking-[0.2em] uppercase ${i === 0 ? "text-red-600 font-bold" : "dial-text text-zinc-200"}`}>
                    PHASE {phase.id}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhaseIntro;