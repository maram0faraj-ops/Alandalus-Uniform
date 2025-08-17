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
import Reports from './pages/Reports'; // استيراد المكون الجديد
import InventoryReport from './pages/InventoryReport';
// ...

function App() {
  return (
    <Router>
      <div className="App">
        {/* كل المسارات يجب أن تكون داخل هذا الغلاف */}
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
            path="/admin/reports" // <<< تم نقل هذا السطر إلى المكان الصحيح
            element={<AdminRoute><AdminLayout><Reports /></AdminLayout></AdminRoute>} 
          />
          <Route path="/admin/reports/inventory" element={<InventoryReport />} />

          {/* صفحات الموظفين (محمية) */}
          <Route 
             path="/staff/deliver"
             element={<PrivateRoute><AdminLayout><DeliverUniformPage /></AdminLayout></PrivateRoute>} 
          />
          
          {/* المسار الافتراضي (يجب أن يكون آخر مسار داخل Routes) */}
          <Route path="*" element={<Navigate to="/login" />} />  {/* <<< تم نقل هذا السطر إلى المكان الصحيح */}

        </Routes>
       </div>
    </Router>
  );
}

 export default App;