import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

import {
  getProductsByGroupAndCategory,
  selectFilteredProducts,
  selectFilteredLoading,
  clearFilteredProducts,
} from "../store/features/user/productSlice";

// --- IMPORT CENTRAL LORE DATA ---
import { moonPhasesData } from "../utils/moonData"; // Adjust path to where you saved moonData.js

// --- IMPORT MODULAR COMPONENTS ---
import GalaxyBackground from "../components/phase00/GalaxyBackground";
import PhaseIntro from "../components/phase00/PhaseIntro";
import PhaseNavigator from "../components/phase00/PhaseNavigator";
import PhaseProducts from "../components/phase00/PhaseProducts";
import PhaseHeroComingSoon from "../components/phase00/PhaseHeroComingSoon";

// Register ScrollTrigger
gsap.registerPlugin(useGSAP, ScrollTrigger);

const Moon = () => {
  const dispatch = useDispatch();
  const containerRef = useRef(null);

  // --- 1. DYNAMIC ROUTING & DATA LOOKUP ---
  const { phase } = useParams(); // Grabs the "00", "01", etc., from the URL
  
  // Find the exact phase in our dictionary, fallback to "00" if URL is invalid
  const currentPhase = moonPhasesData.find((p) => p.id === phase) || moonPhasesData[0];

  // --- 2. STATE ---
  const [introFinished, setIntroFinished] = useState(false);

  // Grab state from Redux
  const products = useSelector(selectFilteredProducts);
  const loading = useSelector(selectFilteredLoading);
  const error = useSelector((state) => state.products.filteredError);

  // --- 3. DYNAMIC FETCH DATA ---
  useEffect(() => {
    dispatch(
      getProductsByGroupAndCategory({
        category: "deskmat",
        group: `phase-${currentPhase.id}`, // Dynamically fetches phase-00, phase-01, etc.
      })
    );
    return () => dispatch(clearFilteredProducts());
  }, [dispatch, currentPhase.id]); // Re-runs fetch whenever the URL phase changes

  // --- 4. MODERN LENIS SMOOTH SCROLL ---
  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.1, 
      wheelMultiplier: 1,
    });

    lenis.on("scroll", ScrollTrigger.update);

    const update = (time) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(update);
      lenis.destroy();
    };
  }, []);

  // --- 5. GSAP ANIMATIONS (Cinematic Pan + Marquee) ---
  useGSAP(
    () => {
      // --- INFINITE FOOTER MARQUEE ---
      gsap.to(".marquee-track", {
        xPercent: -50,
        ease: "none",
        duration: 59, 
        repeat: -1,
      });

      // --- INTRO SEQUENCE (Plays unconditionally on mount) ---
      const tl = gsap.timeline();
      const animationDuration = 5.5; 

      // INITIAL STATES
      gsap.set(".dial-wheel", { rotation: -315 });

      // PART A: INTRO DIAL ANIMATION
      tl.to(".dial-wheel", {
        rotation: 0,
        duration: animationDuration,
        ease: "power2.inOut",
      })
        .fromTo(".intro-overlay", { backgroundColor: "#000000" }, { backgroundColor: "#F7F7F8", duration: animationDuration, ease: "power2.inOut" }, "<")
        .fromTo(".intro-galaxy", { opacity: 1 }, { opacity: 0, duration: animationDuration, ease: "power2.inOut" }, "<")
        .fromTo(".dial-tick-main", { backgroundColor: "#e4e4e7" }, { backgroundColor: "#27272A", duration: animationDuration, ease: "power2.inOut" }, "<")
        .fromTo(".dial-tick-sub", { backgroundColor: "#a1a1aa" }, { backgroundColor: "#52525B", duration: animationDuration, ease: "power2.inOut" }, "<")
        .fromTo(".dial-text", { color: "#e4e4e7" }, { color: "#27272A", duration: animationDuration, ease: "power2.inOut" }, "<")
        .fromTo(".dial-border", { borderColor: "#3f3f46" }, { borderColor: "#d4d4d8", duration: animationDuration, ease: "power2.inOut" }, "<")
        .fromTo(".calibrating-text", { color: "#d4d4d8" }, { color: "#71717A", duration: animationDuration, ease: "power2.inOut" }, "<")

        // Pause to admire the dial
        .to({}, { duration: 0.8 })

        // Explode the Dial 
        .to(".intro-content-wrapper", {
          opacity: 0,
          scale: 1.15,
          duration: 0.8,
          ease: "power2.out",
        })
        // Fade out White Overlay 
        .to(".intro-overlay", { opacity: 0, display: "none", duration: 0.6 }, "-=0.4")

        // ==========================================
        // PART B: TRUE CINEMATIC CAMERA PAN
        // ==========================================
        .to(".moon-canvas", {
          y: "-150vh",
          scale: 1.6,
          opacity: 0,
          filter: "blur(20px)",
          duration: 3.5,
          ease: "power3.inOut"
        }, "-=0.2")

        // PART C: HERO TEXT REVEAL
        .to(".hero-text-element", {
          y: 0,
          opacity: 1,
          duration: 1.5,
          stagger: 0.2,
          ease: "expo.out",
          onStart: () => {
            setIntroFinished(true);
          }, 
        }, "-=2.2")

        // Reveal the rest of the page content
        .from(".void-content", {
          opacity: 0,
          y: 40,
          duration: 1.2,
          ease: "power2.out",
        }, "-=1.0");
        
    },
    { scope: containerRef } 
  );

  // Generate the dynamic text string for the marquee
  const marqueeText = `PHASE ${currentPhase.id} • ${currentPhase.name.toUpperCase()} • THE LUNAR CYCLE • PHASE ${currentPhase.id} • ${currentPhase.name.toUpperCase()} • THE LUNAR CYCLE • `;

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-[#000000] relative selection:bg-red-600 selection:text-white overflow-hidden"
    >
      <GalaxyBackground className="z-0" />

      <PhaseIntro />
      
      {/* PASS THE DYNAMIC DATA DOWN TO HERO */}
      <PhaseHeroComingSoon introFinished={introFinished} currentPhase={currentPhase} />

      <div className="void-content relative z-20 px-5 lg:px-10 max-w-[1600px] mx-auto mt-10">
        
        {/* PASS THE CURRENT PHASE ID TO NAVIGATOR */}
        <PhaseNavigator currentPhaseId={currentPhase.id} />

        {/* --- FIX APPLIED HERE: Added currentPhase={currentPhase} --- */}
        <PhaseProducts products={products} loading={loading} error={error} currentPhase={currentPhase} />

        {/* DYNAMIC INFINITE MARQUEE */}
        <div className="mt-32 border-t border-zinc-900 pt-8 overflow-hidden relative">
          <div className="marquee-track flex w-max">
            <div className="phase-txt whitespace-nowrap pr-10 text-zinc-800 text-6xl md:text-9xl tracking-tighter select-none">
              {marqueeText}
            </div>
            <div className="phase-txt whitespace-nowrap pr-10 text-zinc-800 text-6xl md:text-9xl tracking-tighter select-none">
              {marqueeText}
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default Moon;