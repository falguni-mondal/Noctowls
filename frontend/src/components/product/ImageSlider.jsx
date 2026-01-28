import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Thumbs, Zoom } from "swiper/modules";

import "swiper/css";
import "swiper/css/thumbs";
import "swiper/css/zoom";

const ImageSlider = ({ images }) => {
    const [thumbsSwiper, setThumbsSwiper] = useState(null);
    const [activeIndex, setActiveIndex] = useState(0);

    return (
        <div className="w-full">
            {/* MAIN SLIDER */}
            <div className="w-full bg-zinc-950 aspect-square relative">
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
                            <div className="swiper-zoom-container w-full h-full flex items-center justify-center">
                                <img
                                    src={img.url}
                                    alt="product-main"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>

            {/* THUMBNAILS */}
            <div className="thumbnail-container px-3 mt-4">
                <Swiper
                    onSwiper={setThumbsSwiper}
                    modules={[Thumbs]}
                    slidesPerView={5}
                    spaceBetween={10}
                    watchSlidesProgress
                    className="thumb-swiper"
                >
                    {images.map((img, idx) => (
                        <SwiperSlide key={idx} className="cursor-pointer">
                            <div className={`w-full aspect-square rounded-sm overflow-hidden border-2 transition-all ${
                                idx === activeIndex ? "border-white opacity-100" : "border-transparent opacity-50 hover:opacity-80"
                            }`}>
                                <img
                                    src={img.url}
                                    alt="thumbnail"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>
        </div>
    );
};

export default ImageSlider;