import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';

// استيراد المكونات والصفحات
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import AddStockPage from './pages/AddStockPage';
import PrivateRoute from './components/PrivateRoute';
import AdminLayout from './components/layout/AdminLayout'; // استيراد التخطيط
import PrintBarcodesPage from './pages/PrintBarcodesPage'; // استيراد

// ... (داخل <Routes>)

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* المسار العام */}
          <Route path="/login" element={<LoginPage />} />

          {/* ====================================================== */}
          {/* هنا يتم تغليف جميع صفحات الأدمن بالتخطيط الموحد */}
          {/* ====================================================== */}
          <Route 
            path="/admin/dashboard" 
            element={
              <PrivateRoute>
                <AdminLayout>
                  <AdminDashboard />
                </AdminLayout>
              </PrivateRoute>
            } 
          />
          <Route 
            path="/admin/add-stock" 
            element={
              <PrivateRoute>
                <AdminLayout>
                  <AddStockPage />
                </AdminLayout>
              </PrivateRoute>
            } 
          />
 
<Route  
    path="/admin/print-barcodes" // المسار الجديد
    element={
      <PrivateRoute>
        <AdminLayout>
          <PrintBarcodesPage />
        </AdminLayout>
      </PrivateRoute>
    } 
/>
          
          {/* المسار الافتراضي */}
          <Route path="*" element={<Navigate to="/login" />} />

        </Routes>
      </div>
    </Router>
  );
}

export default App;
