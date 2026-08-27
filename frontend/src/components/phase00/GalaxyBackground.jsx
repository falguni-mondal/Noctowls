import React, { useMemo } from "react";

const GalaxyBackground = ({ className = "" }) => {
  const stars = useMemo(() => {
    return Array.from({ length: 150 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: `${Math.random() * 2 + 0.5}px`,
      opacity: Math.random() * 0.8 + 0.2,
    }));
  }, []);

  return (
    <div className={`absolute inset-0 w-full h-full overflow-hidden pointer-events-none ${className}`}>
      {/* Nebula / Galaxy Dust */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-indigo-900/30 rounded-full blur-[100px] md:blur-[150px] mix-blend-screen" />
      <div className="absolute bottom-1/4 right-[-10%] w-[60vw] h-[60vw] bg-blue-900/20 rounded-full blur-[120px] md:blur-[180px] mix-blend-screen" />
      <div className="absolute top-1/3 left-1/3 w-[30vw] h-[30vw] bg-purple-900/10 rounded-full blur-[80px] mix-blend-screen" />

      {/* Scattered Stars */}
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute rounded-full bg-white shadow-[0_0_4px_rgba(255,255,255,0.8)]"
          style={{
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
            opacity: star.opacity,
          }}
        />
      ))}
    </div>
  );
};

export default GalaxyBackground;