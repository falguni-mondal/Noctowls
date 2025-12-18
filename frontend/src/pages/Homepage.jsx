import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import Hero from '../components/home/hero/Hero';
import HomeMarquee from '../components/home/marquee/HomeMarquee';
import HomeProductSection from '../components/home/products/HomeProductSection';
import { getAllProducts } from '../store/features/user/productSlice';

const Homepage = () => {
  const dispatch = useDispatch();
  
  useEffect(() => {
    dispatch(getAllProducts());
  }, [])

  return (
    <div id='homepage'>
        <Hero />
        <HomeMarquee/>
        <HomeProductSection />
    </div>
  )
}

export default Homepage