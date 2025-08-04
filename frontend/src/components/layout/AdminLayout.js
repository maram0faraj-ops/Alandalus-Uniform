import React from 'react';
import AdminNav from './AdminNav';

// هذا المكون يغلف جميع صفحات الأدمن ليضيف لها شريط التنقل
function AdminLayout({ children }) {
  return (
    <div>
      <AdminNav />
      <main>{children}</main>
    </div>
  );
}

export default AdminLayout;
