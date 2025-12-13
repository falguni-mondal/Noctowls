import { Link } from "react-router-dom";
import { Icon } from "@iconify/react";
import AdminProductItem from "../../../components/admin/panel/product/AdminProductItem";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { getAllProducts } from "../../../store/features/global/productSlice";

const AdminProducts = () => {
  const dispatch = useDispatch();
  const products = useSelector(state => state.product.products);

  useEffect(() => {
    dispatch(getAllProducts());
  }, [])

  return (
    <div className='px-3 py-10' id="admin-product-page">
      <div className="admin-products-options">

      </div>
      <div className="admin-product-header">
        <h1 className="text-2xl font-semibold">Products</h1>
      </div>
      {
        products ?
          <ul className="admin-products-list-container mt-10 flex flex-col gap-3">
            {
              products.map(product => (
                <AdminProductItem product={product} />
              ))
            }
          </ul>
          :
          <p className="text-2xl w-fit mx-auto py-20">No Products</p>
      }
      <div className="add-product-btn w-10 aspect-square rounded fixed bottom-18 right-3">
        <Link className="w-full h-full flex justify-center items-center bg-indigo-950 text-base rounded" to="/admin/products/add">
          <Icon icon="material-symbols:add-2-rounded" />
        </Link>
      </div>
    </div>
  )
}

export default AdminProducts