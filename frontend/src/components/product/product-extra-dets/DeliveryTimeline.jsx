import { Icon } from '@iconify/react/dist/iconify.js';
import React from 'react'

const DeliveryTimeline = () => {
    const today = new Date();
    
    const afterVarDays = (days) => {
        const afterDays = new Date();
        afterDays.setDate(today.getDate() + days);
        return afterDays.toLocaleString("en-US", {
            month: "short",
            day: "2-digit"
        });
    }

    return (
        <div className="product-delivery-timeline-container px-3 md:px-0 mt-6 text-sm text-zinc-400">
            <div className="flex items-center gap-3 bg-zinc-900/50 p-4 rounded border border-zinc-800 shadow-sm">
                <Icon icon="mdi:truck-fast-outline" className="text-2xl text-zinc-300" />
                <p className="leading-tight">
                    Estimated delivery between <span className="text-white font-bold tracking-wide">{afterVarDays(4)} - {afterVarDays(7)}</span>
                </p>
            </div>
        </div>
    )
}

export default DeliveryTimeline;