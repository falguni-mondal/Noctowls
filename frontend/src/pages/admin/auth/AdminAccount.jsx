import AdminAuthRouter from '../../../routes/admin/AdminAuthRouter'

const AdminAccount = () => {
  return (
    <div className='w-full py-20' id='auth-page'>
      <div className="account-header-container">
        <h1 className="account-heading text-3xl uppercase font-medium text-center leading-none px-3">
          noctowls admin account
        </h1>
      </div>
      <AdminAuthRouter />
    </div>
  )
}

export default AdminAccount