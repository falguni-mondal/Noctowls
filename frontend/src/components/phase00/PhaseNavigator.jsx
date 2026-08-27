import React from "react";
import { Icon } from "@iconify/react";
import { toast } from "react-toastify";
import toastControls from "../../utils/global/toastControls"; // Adjust path if necessary based on folder structure

const PhaseNavigator = () => {
  const handlePhaseClick = (phaseNum) => {
    if (phaseNum === 0) return;

    const formattedPhase = String(phaseNum).padStart(2, "0");
    toast.info(`Phase ${formattedPhase} is in planning!!!`, {
      ...toastControls,
      style: { backgroundColor: "#1C1C1E", color: "#fff" },
      icon: <Icon icon="solar:moon-sleep-bold" className="text-red-500 text-xl" />,
    });
  };

  return (
    <div className="w-full overflow-x-auto custom-scrollbar mb-16 py-4">
      <div className="flex gap-6 md:gap-10 border-b border-zinc-800 pb-4 px-4 w-max md:mx-auto">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((phaseNum) => (
          <button
            key={`phase-nav-${phaseNum}`}
            onClick={() => handlePhaseClick(phaseNum)}
            className={`phase-txt text-2xl md:text-4xl transition-all duration-500 ${
              phaseNum === 0
                ? "text-red-600 scale-110 drop-shadow-[0_0_15px_rgba(220,38,38,0.3)]"
                : "text-zinc-600 hover:text-white"
            }`}
          >
            {String(phaseNum).padStart(2, "0")}
          </button>
        ))}
      </div>
    </div>
  );
};

export default PhaseNavigator;