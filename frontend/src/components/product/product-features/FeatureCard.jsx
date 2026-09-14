import React from 'react'

const FeatureCard = ({card}) => {
  return (
    // Light theme card wrapper: bg-white, border-zinc-200, shadow-sm
    <div className='bg-white border border-zinc-200 shadow-sm rounded-lg px-4 py-6 flex flex-col items-center gap-3'>
      <div className="feature-card-image w-[50px] aspect-square bg-zinc-50 rounded-sm">
        <img className='w-full h-full object-cover rounded-sm' src={card.image} alt="" />
      </div>
      <div className="feature-card-dets">
        {/* Light theme title: text-[#0f0f0f] */}
        <h3 className="feature-card-title font-semibold uppercase text-[#0f0f0f] text-sm text-center leading-none">
          {card.title}
        </h3>
        {/* Light theme subtitle text: text-zinc-500 */}
        <p className="feature-card-para text-zinc-500 text-xs text-center mt-2">
          {card.text}
        </p>
      </div>
    </div>
  )
}

export default FeatureCard;