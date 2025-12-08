import {Link} from "react-router-dom";
import { Icon } from "@iconify/react";

const AdminProducts = () => {
  return (
    <div className='h-[70vh] flex justify-center items-center text-2xl font-semibold uppercase'>
      <p>Admin - Products</p>
      <div className="add-product-btn w-10 aspect-square rounded fixed bottom-18 right-3">
        <Link className="w-full h-full flex justify-center items-center bg-indigo-950 text-base rounded" to="/admin/products/add">
          <Icon icon="material-symbols:add-2-rounded" />
        </Link>
      </div>
    </div>
  )
}

export default AdminProducts