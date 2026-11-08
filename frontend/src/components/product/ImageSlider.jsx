import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Thumbs, Zoom } from "swiper/modules";
import { Icon } from "@iconify/react/dist/iconify.js";
import { optimizeImage } from "../../utils/helpers/imageOptimizer";

import "swiper/css";
import "swiper/css/thumbs";
import "swiper/css/zoom";

const ImageSlider = ({ images, productName = "Noctowls" }) => {
  const [thumbsSwiper, setThumbsSwiper] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const seoAltText = `${productName} Extended Gaming Deskmat 900x400mm`;

  return (
    <div className="w-full">
      {/* MAIN SLIDER (Compact height on mobile so Add to Cart & Buy Now stay visible above the fold) */}
      <div className="w-full bg-zinc-950 aspect-[4/3] max-h-[34vh] sm:max-h-[42vh] relative overflow-hidden">
        <Swiper
          modules={[Thumbs, Zoom]}
          thumbs={{ swiper: thumbsSwiper }}
          onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
          spaceBetween={0}
          slidesPerView={1}
          zoom={true}
          className="main-swiper h-full w-full"
        >
          {images.map((img, idx) => (
            <SwiperSlide key={idx}>
              <div
                className="swiper-zoom-container w-full h-full flex items-center justify-center cursor-pointer"
                onClick={() => setIsModalOpen(true)}
              >
                <img
                  src={optimizeImage(img.url, { width: 800, quality: 80 })}
                  alt={seoAltText}
                  loading={idx === 0 ? "eager" : "lazy"}
                  fetchPriority={idx === 0 ? "high" : "auto"}
                  decoding="async"
                  className="w-full h-full object-cover"
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* COMPACT THUMBNAILS */}
      <div className="thumbnail-container px-3 mt-2">
        <Swiper
          onSwiper={setThumbsSwiper}
          modules={[Thumbs]}
          slidesPerView={6}
          spaceBetween={8}
          watchSlidesProgress
          className="thumb-swiper"
        >
          {images.map((img, idx) => (
            <SwiperSlide key={idx} className="cursor-pointer">
              <div
                className={`w-full aspect-square rounded-sm overflow-hidden border-2 transition-all ${
                  idx === activeIndex
                    ? "border-red-600 opacity-100"
                    : "border-transparent opacity-50 hover:opacity-80"
                }`}
              >
                <img
                  src={optimizeImage(img.url, { width: 160, quality: 75 })}
                  alt={seoAltText}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Fullscreen Mobile Zoom Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex flex-col animate-in fade-in duration-200">
          <div className="flex justify-end p-4 absolute top-18 right-0 z-50 w-full bg-gradient-to-b from-black/60 to-transparent">
            <button
              onClick={() => setIsModalOpen(false)}
              className="text-white bg-white/10 rounded-full p-2 hover:bg-zinc-800 transition-colors"
            >
              <Icon icon="mdi:close" className="text-3xl" />
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