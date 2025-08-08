import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';

// استيراد المكونات والصفحات
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboard from './pages/AdminDashboard';
import AddStockPage from './pages/AddStockPage';
import PrintBarcodesPage from './pages/PrintBarcodesPage';
import DeliverUniformPage from './pages/DeliverUniformPage';
import AdminRoute from './components/AdminRoute';
import AdminLayout from './components/layout/AdminLayout'; //  يجب إعادة هذا السطر
import PrivateRoute from './components/PrivateRoute'; // هذا هو المسار الصحيح لملف البرايفت
// App.js
import Reports from './pages/Reports'; // استيراد المكون الجديد



// ملاحظة: لم نعد بحاجة لملف PrivateRoute.js العام

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* المسارات العامة */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* صفحات الأدمن (محمية ببوابة الأدمن) */}
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
          
          {/* صفحة الموظف (محمية ببوابة الأدمن أيضاً بشكل مؤقت) */}
          {/* يمكن لاحقاً إنشاء بوابة StaffRoute إذا احتجنا صلاحيات مختلفة */}
          <Route 
            // الكود الصحيح المقترح

             path="/staff/deliver"
             element={<PrivateRoute><AdminLayout><DeliverUniformPage /></AdminLayout></PrivateRoute>} 
          />
          
          {/* المسار الافتراضي */}
          <Route path="*" element={<Navigate to="/login" />} />

        </Routes>
        
           <Route path="/admin/reports" 
            element={<PrivateRoute><AdminLayout><Reports /></AdminLayout></PrivateRoute>} /> 
      </div>
    </Router>
  );
}

export default App;
