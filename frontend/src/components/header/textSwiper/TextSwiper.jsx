import { useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import { Icon } from "@iconify/react/dist/iconify.js";

const TextSwiper = () => {
  const prevRef = useRef(null);
  const nextRef = useRef(null);

  const texts = [
    "MADE IN INDIA",
    "POWERED BY TECHBOX HINDI ON YOUTUBE",
    "ASSURED GIFT FOR EVERY ORDER",
  ];

  return (
    <div className="relative w-full overflow-hidden bg-red-600 print:hidden">
      {/* Custom Buttons */}
      <button
        ref={prevRef}
        aria-label="previous"
        // Added responsive positioning (md:left-4) and text size (md:text-lg)
        className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-50 text-white md:text-lg lg:text-xl hover:scale-110 transition-transform"
      >
        <Icon icon="material-symbols-light:arrow-back-ios" />
      </button>

      <button
        ref={nextRef}
        aria-label="next"
        // Added responsive positioning (md:right-4) and text size (md:text-lg)
        className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-50 text-white md:text-lg lg:text-xl hover:scale-110 transition-transform"
      >
        <Icon icon="material-symbols-light:arrow-forward-ios" />
      </button>

      <Swiper
        modules={[Navigation, Autoplay]}
        loop={true}
        speed={600}
        autoplay={{
          delay: 4000,
          disableOnInteraction: false,
        }}

        onBeforeInit={(swiper) => {
          swiper.params.navigation.prevEl = prevRef.current;
          swiper.params.navigation.nextEl = nextRef.current;
        }}

        navigation={{
          prevEl: prevRef.current,
          nextEl: nextRef.current,
        }}
        className="text-center"
      >
        {texts.map((text, index) => (
          <SwiperSlide key={index}>
            {/* Responsive Text Scaling:
                - Mobile: text-[0.65rem] (Unchanged)
                - Tablet (md): text-sm
                - Desktop (lg): text-base
                
                Responsive Padding:
                - Mobile: py-3 (Unchanged)
                - Tablet/Desktop: py-4 lg:py-5
            */}
            <p className="font-semibold tracking-wide lg:tracking-wider text-white py-3 text-[0.65rem] lg:text-xs uppercase">
              {text}
            </p>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default TextSwiper;