import { Icon } from '@iconify/react/dist/iconify.js'
import React from 'react'

const NoReview = () => {
  return (
    <div className="no-reviews py-10 flex flex-col items-center justify-center text-zinc-500 bg-zinc-900/30 rounded border border-zinc-800 border-dashed">
      <div className="stars flex justify-center text-2xl mb-2 opacity-50">
        {
          ["1", "2", "3", "4", "5"].map((index) => (
            <Icon key={`fake-stars-${index}`} icon="material-symbols:star-outline-rounded" />
          ))
        }
      </div>
      <p className="text-center font-medium text-sm uppercase tracking-wide">No reviews yet.</p>
      <p className="text-center text-xs mt-1">Be the first to share your experience!</p>
    </div>
  )
}

export default NoReview;