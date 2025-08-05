import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';

// استيراد المكونات والصفحات
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage'; // التأكد من استيراد هذه الصفحة
import AdminDashboard from './pages/AdminDashboard';
import AddStockPage from './pages/AddStockPage';
import PrintBarcodesPage from './pages/PrintBarcodesPage';
import DeliverUniformPage from './pages/DeliverUniformPage';
import PrivateRoute from './components/PrivateRoute';
import AdminLayout from './components/layout/AdminLayout';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* المسارات العامة */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* صفحات الأدمن والموظفين */}
          <Route 
            path="/admin/dashboard" 
            element={<PrivateRoute><AdminLayout><AdminDashboard /></AdminLayout></PrivateRoute>} 
          />
          <Route 
            path="/admin/add-stock" 
            element={<PrivateRoute><AdminLayout><AddStockPage /></AdminLayout></PrivateRoute>} 
          />
          <Route 
            path="/admin/print-barcodes" 
            element={<PrivateRoute><AdminLayout><PrintBarcodesPage /></AdminLayout></PrivateRoute>} 
          />
          <Route 
            path="/staff/deliver"
            element={<PrivateRoute><AdminLayout><DeliverUniformPage /></AdminLayout></PrivateRoute>} 
          />
          
          {/* المسار الافتراضي */}
          <Route path="*" element={<Navigate to="/login" />} />

        </Routes>
      </div>
    </Router>
  );
}

export default App;
