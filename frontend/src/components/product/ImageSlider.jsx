import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Thumbs } from "swiper/modules";

import "swiper/css";
import "swiper/css/thumbs";

const ImageSlider = ({ images }) => {
    const [thumbsSwiper, setThumbsSwiper] = useState(null);
    const [activeIndex, setActiveIndex] = useState(0);

    return (
        <div className="w-full">
            {/* MAIN SLIDER */}
            <Swiper
                modules={[Thumbs]}
                thumbs={{ swiper: thumbsSwiper }}
                onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
                spaceBetween={10}
                slidesPerView={1.05}
                className="main-swiper overflow-hidden"
            >
                {images.map((img, idx) => (
                    <SwiperSlide key={idx}>
                        <img
                            src={img}
                            alt="slide"
                            className="w-full object-cover"
                        />
                    </SwiperSlide>
                ))}
            </Swiper>

            {/* THUMBNAILS */}
            <div className="thumbnail-container px-3">
                <Swiper
                    onSwiper={setThumbsSwiper}
                    modules={[Thumbs]}
                    slidesPerView={4}
                    spaceBetween={12}
                    watchSlidesProgress
                    className="thumb-swiper mt-4"
                >
                    {images.map((img, idx) => (
                        <SwiperSlide key={idx}>
                            <img
                                src={img}
                                alt="thumbnail"
                                className={`w-full h-18 object-cover border 
                ${idx === activeIndex ? "border-white" : "border-transparent"}
              `}
                            />
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>
        </div>
    );
};

export default ImageSlider;
