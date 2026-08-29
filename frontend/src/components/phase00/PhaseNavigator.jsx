import React from "react";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";

// --- IMPORT CENTRAL LORE DATA ---
import { moonPhasesData } from "../../utils/moonData"; // Adjust path based on where you saved it

const PhaseNavigator = ({ currentPhaseId }) => {
  return (
    <div className="w-full overflow-x-auto custom-scrollbar mb-16 py-4">
      <div className="flex gap-8 md:gap-12 border-b border-zinc-800 pb-6 px-4 w-max md:mx-auto items-end">
        
        {moonPhasesData.map((phase) => {
          // Check if this specific link matches the current URL parameter
          const isActive = phase.id === currentPhaseId;

          return (
            <Link
              key={`phase-nav-${phase.id}`}
              to={`/series/moon/${phase.id}`}
              // If clicking the phase we are already on, prevent navigation
              onClick={(e) => isActive && e.preventDefault()}
              className={`group flex flex-col items-center justify-end gap-3 transition-all duration-500 ${
                isActive
                  ? "scale-110 drop-shadow-[0_0_15px_rgba(220,38,38,0.3)] cursor-default"
                  : "hover:-translate-y-2 cursor-pointer" // Subtle lift effect on hover for inactive phases
              }`}
            >
              {/* Added pointer-events-none so clicks pass through to the Link wrapper */}
              <Icon 
                icon={phase.icon} 
                className={`pointer-events-none text-3xl md:text-4xl transition-colors duration-500 ${
                  isActive ? "text-red-600" : "text-zinc-600 group-hover:text-zinc-200"
                }`} 
              />
              
              {/* Added pointer-events-none */}
              <span 
                className={`pointer-events-none phase-txt text-[9px] md:text-[10px] tracking-[0.2em] uppercase whitespace-nowrap transition-colors duration-500 ${
                  isActive ? "text-red-500 font-bold" : "text-zinc-500 group-hover:text-zinc-300"
                }`}
              >
                {phase.name}
              </span>
              
              {/* Added pointer-events-none */}
              <span 
                className={`pointer-events-none phase-txt text-2xl md:text-4xl transition-colors duration-500 leading-none ${
                  isActive ? "text-red-600" : "text-zinc-600 group-hover:text-white"
                }`}
              >
                {phase.id}
              </span>
            </Link>
          );
        })}
        
      </div>
    </div>
  );
};

export default PhaseNavigator;