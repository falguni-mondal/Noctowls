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
        // Light theme container text: text-zinc-600
        <div className="product-delivery-timeline-container px-3 md:px-0 mt-6 text-sm text-zinc-600">
            {/* Light theme box: bg-white, border-zinc-200 */}
            <div className="flex items-center gap-3 bg-white p-4 rounded border border-zinc-200 shadow-sm">
                {/* Light theme icon color */}
                <Icon icon="mdi:truck-fast-outline" className="text-2xl text-zinc-500" />
                <p className="leading-tight">
                    {/* Light theme date highlight: text-[#0f0f0f] */}
                    Estimated delivery between <span className="text-[#0f0f0f] font-bold tracking-wide">{afterVarDays(4)} - {afterVarDays(7)}</span>
                </p>
            </div>
        </div>
    )
}

export default DeliveryTimeline;