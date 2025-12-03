import React from 'react'
import ProductListItem from '../../home/products/ProductListItem'
import { Link } from 'react-router-dom'

const MoreOptions = ({ products }) => {
    return (
        <div className='grid grid-cols-2 gap-x-3 gap-y-10'>
            {
                products.map(product => (
                    <Link to={`/products/${product.id}`}>
                        <ProductListItem key={`${product.id}-more-products-listing-key`} product={product} />
                    </Link>
                ))
            }
        </div>
    )
}

export default MoreOptions