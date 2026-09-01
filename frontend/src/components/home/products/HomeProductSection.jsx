import ProductListItem from './ProductListItem';
import { Link } from 'react-router-dom';
import { useSelector } from "react-redux";

const HomeProductSection = () => {

  const products = useSelector(state => state.products.products);

  return (
    // Replaced bg-black with the light theme background bg-[#f4f4f4]
    <section className='w-full px-5 lg:px-10 bg-[#f4f4f4]' id='home-product-section'>
      {
        products &&
        products.map((group, index) => (
          // Changed border-zinc-900/50 to border-zinc-200 for a subtle light divider
          <section key={`user-${group.category}-product-list-key`} className={`w-full py-10 pb-28 md:py-14 md:pb-28 ${index < products.length-1 && "border-b border-zinc-200"}`} id={`user-${group.category}-product-list-section`}>
            
            {/* Added explicit text-[#0f0f0f] to match the global text color for high contrast */}
            <h2 className='uppercase font-bold text-[#0f0f0f] tracking-wide w-full mb-4 md:mb-8 text-xl md:text-2xl border-l-4 border-l-red-600 pl-2'>
              {group.category}s
            </h2>
            
            {/* Responsive Grid System */}
            <ul className={`homepage-product-list-container grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-2 gap-y-4 md:gap-x-5 md:gap-y-20`}>
              {
                group.products.map(product => (
                  <Link key={`home-product-${product.id}`} to={`/products/${product.id}`}>
                    <ProductListItem key={`${product.id}-listing-key`} product={product} />
                  </Link>
                ))
              }
            </ul>
          </section>
        ))
      }
    </section>
  )
}

export default HomeProductSection;