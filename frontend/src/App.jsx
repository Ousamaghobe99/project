import { useState } from 'react'
import {Navigate, Outlet, Route, Routes} from 'react-router-dom'
import Signin from './pages/auth/sign-in'
import SignUp from './pages/auth/sign-up'
import Dashboard from './pages/dashboard'
import Settings from './pages/settings'
//import Home from './pages/home'
import Accounts from './pages/accounts'
import Transactions from './pages/transactions'
import Budgets from './pages/budgets'
import useStore  from './store'
import Navbar from './components/navbar'
import { Toaster } from 'sonner'
import { setAuthToken } from './libs/apiCall'



const RootLayout = () => {
  const {user} = useStore(state => state);
  setAuthToken(user?.token ?? "")
  console.log(user);

  return !user ?( 
     <Navigate to="/sign-in" replace={true} /> ) : (
    <>
      {<Navbar />}
      <div className="min-h-[cal(h-screen-100px)]" >
        <Outlet />
      </div>    
    </>
    
  );
};


function App() {
  

  return(
    < main > 
  <div className="w-full min-h-screen px bg-gray-100 md:px-20 dark:bg-slate-900  "> 
    <Routes >
      
      <Route element={< RootLayout />}>
        <Route path="/" element={<Navigate to= "/overview"/>} />
        <Route path="/overview" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/budgets" element={<Budgets />} />
      </Route>
      <Route path="/sign-in" element={<Signin />} />
      <Route path="/sign-up" element={<SignUp />} />
      <Route path="*" element={<Navigate to="/sign-up" />} />
    </Routes>
  </div>
  <Toaster richColors position='top-centre'/>
  </main>
  );
}
export default App
