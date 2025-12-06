import React from 'react'

const AdminProducts = () => {
  return (
    <div className='h-[70vh] flex justify-center items-center text-2xl font-semibold uppercase'>
      <p>Admin - Products</p>
      <div className="add-product-btn">
        <Link to="/admin/product/add">
          <Icon icon="material-symbols:add-2-rounded" />
        </Link>
      </div>
    </div>

  )
}

export default AdminProducts