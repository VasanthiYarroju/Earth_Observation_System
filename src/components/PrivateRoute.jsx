// src/components/PrivateRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PrivateRoute = ({ children, redirectPath = "/earth" }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>; // Optional global loader
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

export default PrivateRoute;
