import { Icon } from '@iconify/react/dist/iconify.js';
import React from 'react'

const DeliveryTimeline = () => {
    const today = new Date();
    const date = today.toLocaleString("en-US", {
        month: "short",
        day: "2-digit"
    });

    const afterVarDays = (days) => {
        const afterDays = new Date();
        afterDays.setDate(today.getDate() + days);
        return afterDays.toLocaleString("en-US", {
            month: "short",
            day: "2-digit"
        });
    }

    return (
        <div className="product-delivery-timeline-container px-3 mt-10">
            <h2 className="timeline-heading font-medium leading-none">You'll receive your package between <span className="font-semibold tracking-wider">{afterVarDays(4)} - {afterVarDays(8)}</span></h2>

            <div className="product-timeline p-5 border border-indigo-100 rounded-lg flex justify-between mt-3 font-semibold">
                <div className="product-order-time flex flex-col items-center gap-2">
                    <span className="product-order-icon w-10 aspect-square rounded-full bg-indigo-100 flex justify-center items-center text-red-600 text-xl">
                        <Icon icon="mdi:cart-arrow-down" />
                    </span>
                    <h3 className="subject-timeline-heading text-sm w-[8ch] text-center leading-none">
                        Ordered
                    </h3>
                    <p className="subject-timeline w-[8ch] text-center leading-none">
                        {date}
                    </p>
                </div>

                <div className="product-shipment-time flex flex-col items-center gap-2">
                    <span className="product-shipment-icon w-10 aspect-square rounded-full bg-indigo-100 flex justify-center items-center text-red-600 text-xl">
                        <Icon icon="icon-park-outline:truck" />
                    </span>
                    <h3 className="subject-timeline-heading text-sm w-[10ch] text-center leading-none">
                        Shipped
                    </h3>
                    <p className="subject-timeline w-[10ch] text-center leading-none">
                        {afterVarDays(2)} - {afterVarDays(3)}
                    </p>
                </div>

                <div className="product-delivery-time flex flex-col items-center gap-2">
                    <span className="product-delivery-icon w-10 aspect-square rounded-full bg-indigo-100 flex justify-center items-center text-red-600 text-xl">
                        <Icon icon="material-symbols:location-on-outline-rounded" />
                    </span>
                    <h3 className="subject-timeline-heading text-sm w-[10ch] text-center leading-none">
                        Delivered
                    </h3>
                    <p className="subject-timeline w-[10ch] text-center leading-none">
                        {afterVarDays(4)} - {afterVarDays(8)}
                    </p>
                </div>
            </div>
        </div>
    )
}

export default DeliveryTimeline