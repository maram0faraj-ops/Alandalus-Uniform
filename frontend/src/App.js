import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';

// استيراد المكونات والصفحات
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboard from './pages/AdminDashboard';
import AddStockPage from './pages/AddStockPage';
import PrintBarcodesPage from './pages/PrintBarcodesPage';
import DeliverUniformPage from './pages/DeliverUniformPage';
import AdminLayout from './components/layout/AdminLayout';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import Reports from './pages/Reports';
import InventoryReportPage from './pages/InventoryReportPage';
import ManageInventoryPage from './pages/ManageInventoryPage';

function App() {
  // 1. حالة للتحقق من تسجيل الدخول
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // 2. التحقق من التوكن عند فتح الموقع
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      if (token) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  // دالة لتحديث الحالة عند تسجيل الدخول
  const setAuth = (boolean) => {
    setIsAuthenticated(boolean);
  };

  if (loading) {
    return <div className="text-center mt-5">جاري التحميل...</div>;
  }

  return (
    <Router>
      <div className="App">
        <Routes>

          {/* المسارات العامة */}
          
          {/* تعديل هام: إذا كان مسجل دخول، يذهب للداشبورد، وإلا يذهب لصفحة الدخول */}
          <Route 
            path="/login" 
            element={
              !isAuthenticated ? 
              <LoginPage setAuth={setAuth} /> : 
              <Navigate to="/admin/dashboard" />
            } 
          />
          
          <Route path="/register" element={<RegisterPage />} />

          {/* صفحات الأدمن (محمية) */}
          <Route 
            path="/admin/dashboard" 
            element={<AdminRoute><AdminLayout><AdminDashboard /></AdminLayout></AdminRoute>} 
          />
          <Route 
            path="/admin/add-stock" 
            element={<AdminRoute><AdminLayout><AddStockPage /></AdminLayout></AdminRoute>} 
          />
          
          <Route 
            path="/admin/manage-inventory" 
            element={<AdminRoute><AdminLayout><ManageInventoryPage /></AdminLayout></AdminRoute>} 
          />
          <Route 
            path="/admin/print-barcodes" 
            element={<AdminRoute><AdminLayout><PrintBarcodesPage /></AdminLayout></AdminRoute>} 
          />
          <Route 
            path="/admin/reports"
            element={<AdminRoute><AdminLayout><Reports /></AdminLayout></AdminRoute>} 
          />
          <Route 
            path="/admin/reports/inventory" 
            element={<AdminRoute><AdminLayout><InventoryReportPage /></AdminLayout></AdminRoute>} 
          />

          {/* صفحات الموظفين (محمية) */}
          <Route 
             path="/staff/deliver"
             element={<PrivateRoute><AdminLayout><DeliverUniformPage /></AdminLayout></PrivateRoute>} 
          />
          
          {/* الصفحة الرئيسية: توجهك حسب حالتك */}
          <Route 
            path="/" 
            element={isAuthenticated ? <Navigate to="/admin/dashboard" /> : <Navigate to="/login" />} 
          />

          {/* أي رابط خطأ يوجهك للرئيسية */}
          <Route path="*" element={<Navigate to="/" />} />

        </Routes>
       </div>
    </Router>
  );
}

export default App;