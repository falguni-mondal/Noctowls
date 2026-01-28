import ProductListItem from './ProductListItem';
import { Link } from 'react-router-dom';
import { useSelector } from "react-redux";

const HomeProductSection = () => {

  const products = useSelector(state => state.products.products);

  return (
    // Added md:px-8 lg:px-16 for responsive horizontal padding
    <section className='w-full px-4 md:px-8 lg:px-16' id='home-product-section'>
      {
        products &&
        products.map((group, index) => (
          // Increased vertical padding for tablets/desktops (md:py-14)
          <section key={`user-${group.category}-product-list-key`} className={`w-full py-10 md:py-14 ${index < products.length-1 && "border-b border-zinc-800"}`} id={`user-${group.category}-product-list-section`}>
            
            {/* Scaled up font size for section headers on larger screens (md:text-xl lg:text-2xl) */}
            <h2 className='uppercase font-semibold tracking-wide w-full mb-4 md:mb-8 md:text-xl lg:text-2xl'>{group.category}s</h2>
            
            {/* Responsive Grid System:
                - Mobile: grid-cols-2 (Unchanged)
                - Tablet (md): grid-cols-3
                - Desktop (lg): grid-cols-4
                - Large Desktop (xl): grid-cols-5
                
                Responsive Spacing:
                - Mobile: gap-x-4 gap-y-8 (Unchanged)
                - Tablet/Desktop: gap-x-6 gap-y-10
            */}
            <ul className={`homepage-product-list-container grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-8 md:gap-x-6 md:gap-y-10`}>
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