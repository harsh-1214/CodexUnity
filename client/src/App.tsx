import {
  Navigate,
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
} from "react-router-dom";
import { useAppSelector } from "./app/hooks";

import Home from "./pages/Home";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Layout from "./components/Layout";
import Hello from "./pages/Hello";
import SandBox from "./pages/SandBox";
import CreateFile from "./pages/CreateFile";
import JoinRoom from "./pages/JoinRoom";
import CollabarativeSandBox from "./pages/CollabarativeSandBox";
import ErrorBoundary from "./components/Error";

// 1. Create a wrapper for routes that require a user
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const user = useAppSelector((state) => state.auth.user);
  if (!user) return <Navigate to="/signin" replace />;
  return children;
};

// 2. Create a wrapper for routes that should hide when logged in (like Sign In)
const PublicRoute = ({ children }: { children: JSX.Element }) => {
  const user = useAppSelector((state) => state.auth.user);
  if (user) return <Navigate to="/" replace />;
  return children;
};

// 3. Create a wrapper for your index route to handle the Home/Hello split
const IndexRoute = () => {
  const user = useAppSelector((state) => state.auth.user);
  return user ? <Home user={user} /> : <Hello />;
};

// 4. Define the router OUTSIDE of any component
const router = createBrowserRouter(
  createRoutesFromElements(
    // added errorElement
    <Route path="/" element={<Layout />} errorElement={<ErrorBoundary />}>
      <Route index element={<IndexRoute />} />

      <Route path="signin" element={<PublicRoute><SignIn /></PublicRoute>} />
      <Route path="signup" element={<PublicRoute><SignUp /></PublicRoute>} />

      <Route path="sandbox/:userId/:fileId" element={<ProtectedRoute><SandBox /></ProtectedRoute>} />
      <Route path="collab/:roomId" element={<ProtectedRoute><CollabarativeSandBox /></ProtectedRoute>} />

      {/* <Route path="*" element={<ErrorBoundary />} /> */}
      <Route path="*" element={<div>404 - Page Not Found</div>} />
    </Route>
  )
);

function App() {
  return <RouterProvider router={router} />;
}

export default App;