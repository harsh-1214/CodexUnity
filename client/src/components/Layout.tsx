
import NavBar from './NavBar'
import { Outlet } from 'react-router-dom'

const Layout = () => {
  return (
    <div>
      <NavBar/>
      <Outlet/>
      {/* <Footer/> */}
    </div>
  )
}

export default Layout