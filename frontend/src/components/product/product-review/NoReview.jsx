import { Icon } from '@iconify/react/dist/iconify.js'
import React from 'react'

const NoReview = () => {
  return (
    <div className="no-reviews py-5">
      <div className="stars flex justify-center text-lg">
        {
          ["1", "2", "3", "4", "5"].map((index) => (
            <Icon key={`fake-stars-${index}`} icon="material-symbols:star-rounded" />
          ))
        }
      </div>
      <p className="text-center font-medium text-lg">There is no review yet.</p>
    </div>
  )
}

export default NoReview