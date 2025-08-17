// App.js (النسخة الكاملة والصحيحة)
import React from 'react';
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
// --- تم التصحيح هنا ---
// اسم الملف الصحيح هو InventoryReportPage.js
import InventoryReportPage from './pages/InventoryReportPage'; 

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>

          {/* المسارات العامة */}
          <Route path="/login" element={<LoginPage />} />
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
            path="/admin/print-barcodes" 
            element={<AdminRoute><AdminLayout><PrintBarcodesPage /></AdminLayout></AdminRoute>} 
          />
          <Route 
            path="/admin/reports"
            element={<AdminRoute><AdminLayout><Reports /></AdminLayout></AdminRoute>} 
          />
          {/* --- وتم التصحيح هنا --- */}
          {/* تمت إضافة الحماية والتخطيط واستخدام اسم المكون الصحيح */}
          <Route 
            path="/admin/reports/inventory" 
            element={<AdminRoute><AdminLayout><InventoryReportPage /></AdminLayout></AdminRoute>} 
          />

          {/* صفحات الموظفين (محمية) */}
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