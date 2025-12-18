import ProductListItem from './ProductListItem';
import { Link } from 'react-router-dom';
import { useSelector } from "react-redux";

const HomeProductSection = () => {

  const products = useSelector(state => state.products.products);

  return (
    <section className='w-full px-4' id='home-product-section'>
      {
        products &&
        products.map((group, index) => (
          <section key={`user-${group.category}-product-list-key`} className={`w-full py-10 ${index < products.length-1 && "border-b border-zinc-800"}`} id={`user-${group.category}-product-list-section`}>
            <h2 className='uppercase font-semibold tracking-wide w-full mb-4'>{group.category}s</h2>
            <ul className={`homepage-product-list-container grid grid-cols-2 gap-x-4 gap-y-8`}>
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

export default HomeProductSection