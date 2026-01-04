import React from 'react';
import { Navigate } from 'react-router-dom';

const AdminRoute = ({ children }) => {
  // نقرأ التوكن والدور مباشرة كما حفظناهم في صفحة الدخول
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  
  // 1. إذا لم يكن هناك توكن -> ارجع لصفحة الدخول
  if (!token) {
    return <Navigate to="/login" />;
  }

  // 2. إذا كان الدور ليس "admin" -> ارجع لصفحة الموظفين (أو أي صفحة أخرى)
  if (role !== 'admin') {
    return <Navigate to="/staff/deliver" />;
  }

  // 3. كل شيء سليم -> اسمح بالدخول
  return children;
};

export default AdminRoute;