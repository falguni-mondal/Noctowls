import React from 'react'

const FeatureCard = ({card}) => {
  return (
    <div className='bg-zinc-900 rounded-lg px-4 py-6 flex flex-col items-center gap-3'>
      <div className="feature-card-image w-[50px] aspect-square bg-zinc-100 rounded-sm">
        <img className='w-full h-full object-cover rounded-sm' src={card.image} alt="" />
      </div>
      <div className="feature-card-dets">
        <h3 className="feature-card-title font-semibold uppercase text-sm text-center leading-none">
          {card.title}
        </h3>
        <p className="feature-card-para text-xs text-center mt-2">
          {card.text}
        </p>
      </div>
    </div>
  )
}

export default FeatureCard