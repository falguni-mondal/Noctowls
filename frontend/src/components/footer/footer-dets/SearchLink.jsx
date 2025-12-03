import React from 'react'
import { Link } from 'react-router-dom'

const SearchLink = ({ data }) => {
  return (
    <section className='footer-links-section'>
      <h3 className='footer-section-heading font-semibold tracking-wider mt-3 capitalize'>quick links</h3>
      <div className="search-container w-full">
        <span className='w-full block mt-2 py-2 px-3 rounded-[3px] border border-zinc-800 outline-0 bg-zinc-900 text-zinc-400'>Search on Noctowls</span>
      </div>
    </section>
  )
}

export default SearchLink