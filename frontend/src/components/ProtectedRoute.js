import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const location = useLocation();
  const token = localStorage.getItem('token');
  const userString = localStorage.getItem('user');

  if (!token || !userString) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to. This allows us to send them along to that page after they login.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const user = JSON.parse(userString);

  // Check if the user's role is in the list of allowed roles
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If the user is logged in but doesn't have the right role,
    // send them to a default page based on their role.
    if (user.role === 'user') {
      return <Navigate to="/staff/deliver" replace />;
    }
    // For any other case, redirect to login
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
