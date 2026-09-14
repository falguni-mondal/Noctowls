import { Icon } from '@iconify/react/dist/iconify.js'
import React from 'react'

const NoReview = () => {
  return (
    // Light theme empty state: white bg, dashed light border
    <div className="no-reviews py-10 flex flex-col items-center justify-center text-zinc-500 bg-white rounded border border-zinc-200 border-dashed shadow-sm">
      {/* Light theme empty stars */}
      <div className="stars flex justify-center text-2xl mb-2 text-zinc-300">
        {
          ["1", "2", "3", "4", "5"].map((index) => (
            <Icon key={`fake-stars-${index}`} icon="material-symbols:star-outline-rounded" />
          ))
        }
      </div>
      <p className="text-center font-bold text-[#0f0f0f] text-sm uppercase tracking-wide">No reviews yet.</p>
      <p className="text-center text-zinc-500 text-xs mt-1">Be the first to share your experience!</p>
    </div>
  )
}

export default NoReview;