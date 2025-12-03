import { Route, Routes } from 'react-router-dom';
import Homepage from '../pages/Homepage';
import Account from '../pages/auth/Account';
import Productpage from '../pages/Productpage';
import Catalog from '../pages/Catalog';

const PageRouter = () => {
  return (
    <Routes>
        <Route path='/' element={<Homepage />}/>
        <Route path='/catalog' element={<Catalog />}/>
        <Route path='/account/*' element={<Account />}/>
        <Route path='/products/:id' element={<Productpage />}/>
    </Routes>
  )
}

export default PageRouter