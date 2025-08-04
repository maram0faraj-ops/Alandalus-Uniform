import axios from 'axios';

// إنشاء نسخة مخصصة من axios
const api = axios.create({
  // هذا السطر يقرأ العنوان من متغيرات البيئة، وإذا لم يجده، يستخدم العنوان المحلي كخيار احتياطي
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

/*
  هذا الجزء المتقدم يقوم بإضافة "التوكن" تلقائياً إلى أي طلب يتم إرساله
  إذا كان المستخدم مسجلاً دخوله. هذا يجعل الكود في الصفحات الأخرى أنظف.
*/
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      // لا تقم بإضافة رأس المصادقة لطلبات تسجيل الدخول أو التسجيل
      if (!config.url.includes('/api/auth/login') && !config.url.includes('/api/auth/register')) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
