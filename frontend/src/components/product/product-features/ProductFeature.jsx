import React from 'react'
import india from "../../../assets/icons/india.webp";
import delivery from "../../../assets/icons/delivery.webp";
import service from "../../../assets/icons/service.gif";
import exchange from "../../../assets/icons/exchange.png";
import FeatureCard from './FeatureCard';
const ProductFeature = () => {
    const features = [
        {
            image: india,
            title: "made in india",
            text: "Proudly Made in India for You."
        },
        {
            image: delivery,
            title: "free delivery",
            text: "Free delivery on all orders."
        },
        {
            image: exchange,
            title: "7 days exchange",
            text: "Exchange anytime within 7 days."
        },
        {
            image: service,
            title: "whatsapp support",
            text: "Real humans. Real help."
        },
    ]

    return (
        <div className="product-features-container grid grid-cols-2 gap-2 mt-10">
            {
                features.map(card => (
                    <FeatureCard card={card}/>
                ))
            }
        </div>
    )
}

export default ProductFeature