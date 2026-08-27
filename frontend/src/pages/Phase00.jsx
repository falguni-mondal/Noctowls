import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
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

// --- IMPORT MODULAR COMPONENTS ---
import GalaxyBackground from "../components/phase00/GalaxyBackground";
import PhaseIntro from "../components/phase00/PhaseIntro";
import PhaseNavigator from "../components/phase00/PhaseNavigator";
import PhaseProducts from "../components/phase00/PhaseProducts";
import PhaseHeroComingSoon from "../components/phase00/PhaseHeroComingSoon";

// Register ScrollTrigger for the Parallax depth effect
gsap.registerPlugin(useGSAP, ScrollTrigger);

const Phase00 = () => {
  const dispatch = useDispatch();
  const containerRef = useRef(null);

  // --- 1. ADDED STATE FOR INTRO ANIMATION ---
  const [introFinished, setIntroFinished] = useState(false);

  // Grab state from Redux
  const products = useSelector(selectFilteredProducts);
  const loading = useSelector(selectFilteredLoading);
  const error = useSelector((state) => state.products.filteredError);

  // --- 2. FETCH DATA ---
  useEffect(() => {
    dispatch(
      getProductsByGroupAndCategory({
        category: "deskmat",
        group: "phase-00",
      })
    );
    return () => dispatch(clearFilteredProducts());
  }, [dispatch]);

  // --- 3. MODERN LENIS SMOOTH SCROLL ---
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

  // --- 4. GSAP ANIMATIONS (Intro + Parallax) ---
  useGSAP(
    () => {
      // Removed the global onComplete trigger from here
      const tl = gsap.timeline();
      const animationDuration = 5.5; 

      // INITIAL STATES
      gsap.set(".dial-wheel", { rotation: -315 });

      // PART A: INTRO ANIMATION
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

        // Pause to admire the locked-in Phase 00 on the white background
        .to({}, { duration: 0.8 })

        // Explode the Dial 
        .to(".intro-content-wrapper", {
          opacity: 0,
          scale: 1.15,
          duration: 0.8,
          ease: "power2.out",
        })
        // Fade out the White Overlay to seamlessly reveal the Halfmoon & Black Galaxy underneath
        .to(
          ".intro-overlay",
          {
            opacity: 0,
            display: "none",
            duration: 0.6,
          },
          "-=0.4"
        )

        // STAGGER IN PAGE ELEMENTS
        .from(
          ".hero-element",
          {
            y: 40,
            opacity: 0,
            duration: 1,
            stagger: 0.15,
            ease: "power3.out",
            // --- TRIGGER STATE EARLY ---
            // Fires the exact moment the text begins fading upward into view
            onStart: () => setIntroFinished(true), 
          },
          "-=0.2"
        )
        .from(
          ".void-content",
          {
            opacity: 0,
            y: 30,
            duration: 1,
            ease: "power2.out",
          },
          "-=0.6"
        );

      // PART B: ENHANCED PARALLAX SCROLL EFFECT
      gsap.to([".parallax-text-top", ".parallax-text-bottom"], {
        y: 180, 
        ease: "none",
        scrollTrigger: {
          trigger: ".parallax-container",
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      gsap.to(".moon-canvas", {
        y: -90, 
        ease: "none",
        scrollTrigger: {
          trigger: ".parallax-container",
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

    },
    { scope: containerRef }
  );

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-[#000000] relative selection:bg-red-600 selection:text-white overflow-hidden"
    >
      {/* 1. Base Layer: Stars */}
      <GalaxyBackground className="z-0" />

      {/* 2. Intro Animation Component */}
      <PhaseIntro />
      
      {/* 3. The Moon & Hero Text Component (Receiving early trigger) */}
      <PhaseHeroComingSoon introFinished={introFinished} />

      {/* 4. Page Content */}
      <div className="void-content relative z-20 px-5 lg:px-10 max-w-[1600px] mx-auto mt-10">
        
        {/* Nav Component */}
        <PhaseNavigator />

        {/* Product Grid Component */}
        <PhaseProducts products={products} loading={loading} error={error} />

        {/* Footer Marquee Graphic */}
        <div className="mt-32 border-t border-zinc-900 pt-8 overflow-hidden relative">
          <div className="phase-txt whitespace-nowrap flex text-zinc-800 text-6xl md:text-9xl tracking-tighter select-none">
            PHASE 00 • GENESIS • THE BEGINNING • PHASE 00 • GENESIS • THE BEGINNING •
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default Phase00;