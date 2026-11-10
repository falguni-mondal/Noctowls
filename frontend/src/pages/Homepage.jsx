import { useEffect, lazy, Suspense } from "react";
import { useDispatch } from "react-redux";
import Hero from "../components/home/hero/Hero";
import HomeMarquee from "../components/home/marquee/HomeMarquee";
import HomeProductSection from "../components/home/products/HomeProductSection";
import {
  getAllProducts,
  getPhase00Products,
} from "../store/features/user/productSlice";

const HomeReels = lazy(() => import("../components/home/reels/HomeReels"));

const Homepage = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    // Separate API calls for Phase 00 products and Classic products
    dispatch(getPhase00Products());
    dispatch(getAllProducts());
  }, [dispatch]);

  return (
    <div id="homepage">
      <Hero />
      <HomeMarquee />
      <HomeProductSection />
      <Suspense fallback={<div className="w-full py-12 bg-[#f4f4f4]" />}>
        <HomeReels />
      </Suspense>
    </div>
  );
};

export default Homepage;