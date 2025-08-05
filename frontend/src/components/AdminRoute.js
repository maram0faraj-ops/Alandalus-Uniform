import React from 'react';
import { Navigate } from 'react-router-dom';

// هذه البوابة تتحقق من وجود توكن ومن أن دور المستخدم هو "admin"
const AdminRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const userString = localStorage.getItem('user');
  
  if (!token || !userString) {
    return <Navigate to="/login" />;
  }

  const user = JSON.parse(userString);

  if (user.role !== 'admin') {
    // إذا لم يكن المستخدم أدمن، يتم توجيهه إلى صفحة تسليم الزي
    return <Navigate to="/staff/deliver" />;
  }

  return children;
};

 export default AdminRoute;