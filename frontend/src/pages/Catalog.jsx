import ProductListItem from '../components/home/products/ProductListItem'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { getAllProducts } from '../store/features/user/productSlice';
import { useEffect } from 'react';
import Loader from '../utils/loader/Loader';

const Catalog = () => {
  const {products, productsLoading} = useSelector(state => state.products);

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getAllProducts());
  }, [])

  if(productsLoading){
    return <Loader />
  }

  return (
    <div className='py-10' id='catalog-page'>
      <div className="catalog-header pb-8 border-b-[0.5px] border-zinc-700 px-3">
        <h1 className='catalog-heading uppercase font-semibold text-2xl'>Products</h1>
      </div>
      {
        products &&
        products.map((group, index) => (
          <section key={`user-${group.category}-product-list-key`} className={`w-full py-10 px-3 ${index < products.length - 1 && "border-b border-zinc-800"}`} id={`user-${group.category}-product-list-section`}>
            <h2 className='uppercase font-semibold tracking-wide w-full mb-4'>{group.category}s</h2>
            <ul className={`catalog-product-list-container grid grid-cols-2 gap-x-4 gap-y-8`}>
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
  )
}

export default Catalog