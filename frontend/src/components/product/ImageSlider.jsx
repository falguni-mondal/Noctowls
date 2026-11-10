import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Thumbs, Zoom } from "swiper/modules";
import { Icon } from "@iconify/react/dist/iconify.js";
import { optimizeImage } from "../../utils/helpers/imageOptimizer";

import "swiper/css";
import "swiper/css/thumbs";
import "swiper/css/zoom";

const ImageSlider = ({ images = [], productName = "Noctowls" }) => {
  const [thumbsSwiper, setThumbsSwiper] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadedMap, setLoadedMap] = useState({});

  const seoAltText = `${productName} Extended Gaming Deskmat 900x400mm`;

  const markImageLoaded = (idx) => {
    setLoadedMap((prev) => (prev[idx] ? prev : { ...prev, [idx]: true }));
  };

  return (
    <div className="w-full select-none">
      {/* MAIN SLIDER (Compact height on mobile so Add to Cart & Buy Now stay visible above the fold) */}
      <div className="w-full bg-zinc-950 aspect-[4/3] max-h-[34vh] sm:max-h-[42vh] relative overflow-hidden">
        <Swiper
          modules={[Thumbs, Zoom]}
          thumbs={{
            swiper:
              thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null,
          }}
          onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
          spaceBetween={0}
          slidesPerView={1}
          zoom={true}
          className="main-swiper h-full w-full"
        >
          {images.map((img, idx) => (
            <SwiperSlide key={idx}>
              <div
                className="swiper-zoom-container w-full h-full flex items-center justify-center cursor-pointer relative"
                onClick={() => setIsModalOpen(true)}
              >
                {!loadedMap[`main-${idx}`] && (
                  <div className="absolute inset-0 bg-zinc-800 animate-pulse z-0" />
                )}
                <img
                  src={optimizeImage(img.url, { width: 800, quality: 80 })}
                  alt={seoAltText}
                  loading={idx === 0 ? "eager" : "lazy"}
                  fetchPriority={idx === 0 ? "high" : "auto"}
                  decoding="async"
                  onLoad={() => markImageLoaded(`main-${idx}`)}
                  className={`w-full h-full object-cover transition-opacity duration-300 ${
                    loadedMap[`main-${idx}`] ? "opacity-100" : "opacity-0"
                  }`}
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Glassmorphic Image Counter & Tap-to-Zoom Pill */}
        {images.length > 0 && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="absolute bottom-2.5 right-3 z-20 inline-flex items-center gap-1.5 bg-black/65 backdrop-blur-md text-white border border-white/15 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider shadow-sm"
          >
            <Icon icon="solar:magnifer-zoom-in-linear" className="text-xs" />
            <span>
              {activeIndex + 1} / {images.length}
            </span>
          </button>
        )}
      </div>

      {/* GRADIENT BORDER THUMBNAIL STRIP */}
      <div className="thumbnail-container px-3 mt-2.5">
        <Swiper
          onSwiper={setThumbsSwiper}
          modules={[Thumbs]}
          slidesPerView={5.5}
          spaceBetween={10}
          watchSlidesProgress
          className="thumb-swiper py-1.5 px-0.5"
        >
          {images.map((img, idx) => {
            const isSelected = idx === activeIndex;
            return (
              <SwiperSlide key={idx} className="cursor-pointer py-0.5">
                <div className="flex flex-col items-center gap-1.5">
                  {/* Gradient Border Wrapper */}
                  <div
                    className={`w-full aspect-square rounded-xl p-[2.5px] transition-all duration-300 ${
                      isSelected
                        ? "bg-gradient-to-tr from-red-600 via-amber-500 to-rose-500 shadow-[0_4px_12px_rgba(220,38,38,0.3)] scale-100 opacity-100"
                        : "bg-zinc-200/80 opacity-55 hover:opacity-85 scale-[0.93]"
                    }`}
                  >
                    <div className="w-full h-full rounded-[9px] overflow-hidden bg-white">
                      <img
                        src={optimizeImage(img.url, { width: 160, quality: 75 })}
                        alt={seoAltText}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* Subtle Gradient Indicator Bar */}
                  <span
                    className={`h-1 rounded-full transition-all duration-300 ${
                      isSelected
                        ? "w-5 bg-gradient-to-r from-red-600 via-amber-500 to-rose-500"
                        : "w-1 bg-transparent"
                    }`}
                  />
                </div>
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>

      {/* Fullscreen Mobile Zoom Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex flex-col animate-in fade-in duration-200">
          <div className="flex items-center justify-between px-4 py-3 absolute top-16 left-0 right-0 z-50 bg-gradient-to-b from-black/70 to-transparent">
            <span className="text-xs font-bold tracking-widest uppercase text-zinc-300">
              {activeIndex + 1} / {images.length}
            </span>
            <button
              onClick={() => setIsModalOpen(false)}
              className="text-white bg-white/10 border border-white/15 rounded-full p-2 hover:bg-zinc-800 transition-colors"
            >
              <Icon icon="mdi:close" className="text-2xl" />
            </button>
          </div>

          <div className="flex-1 h-full w-full flex items-center justify-center">
            <Swiper
              modules={[Zoom]}
              zoom={true}
              initialSlide={activeIndex}
              onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
              className="w-full h-full"
            >
              {images.map((img, idx) => (
                <SwiperSlide key={`modal-slide-${idx}`}>
                  <div className="swiper-zoom-container w-full h-full flex items-center justify-center p-2">
                    <img
                      src={optimizeImage(img.url, { width: 2000, quality: 85 })}
                      alt={seoAltText}
                      loading={idx === activeIndex ? "eager" : "lazy"}
                      decoding="async"
                      className="w-full h-auto max-h-full object-contain"
                    />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageSlider;