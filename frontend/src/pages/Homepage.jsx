import React from 'react'
import Hero from '../components/home/hero/Hero'
import HomeMarquee from '../components/home/marquee/HomeMarquee'
import HomeProductSection from '../components/home/products/HomeProductSection'

const Homepage = () => {
  return (
    <div id='homepage'>
        <Hero />
        <HomeMarquee/>
        <HomeProductSection />
    </div>
  )
}

export default Homepage