import ProductListItem from '../components/home/products/ProductListItem'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { getAllProducts } from '../store/features/user/productSlice';
import { useEffect } from 'react';
import Loader from '../utils/loader/Loader';

const Catalog = () => {
  const { products, productsLoading } = useSelector(state => state.products);

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getAllProducts());
  }, [dispatch]) // Added dependency for safety

  if (productsLoading) {
    return <Loader />
  }

  return (
    <div className='py-10 bg-black min-h-screen text-zinc-100' id='catalog-page'>
      
      {/* Central Container to constrain width on huge screens */}
      <div className="max-w-[1600px] mx-auto">
        
        {/* Header Section */}
        <div className="catalog-header pb-6 md:pb-10 border-b border-zinc-800 px-4 md:px-8">
          <h1 className='catalog-heading uppercase font-black text-2xl md:text-4xl tracking-tight'>
            Products
          </h1>
        </div>

        {/* Product Groups */}
        {
          products &&
          products.map((group, index) => (
            <section 
              key={`user-${group.category}-product-list-key`} 
              className={`w-full py-10 md:py-16 px-4 md:px-8 ${index < products.length - 1 && "border-b border-zinc-800"}`} 
              id={`user-${group.category}-product-list-section`}
            >
              
              {/* Category Heading */}
              <div className="flex items-center gap-4 mb-6 md:mb-10">
                <h2 className='uppercase font-semibold tracking-wider text-xl lg:text-2xl'>
                  {group.category}s
                </h2>
              </div>

              {/* Responsive Grid */}
              <ul className={`catalog-product-list-container grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-2 gap-y-4 md:gap-x-4 md:gap-y-8`}>
                {
                  group.products.map(product => (
                    <Link key={`catalog-product-${product.id}`} to={`/products/${product.id}`}>
                      <ProductListItem key={`${product.id}-listing-key`} product={product} />
                    </Link>
                  ))
                }
              </ul>
            </section>
          ))
        }
      </div>
    </div>
  )
}

export default Catalog;