// server.js (النسخة التشخيصية النهائية)

// Import core packages
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const cron = require('node-cron');

// Initialize the app
const app = express();
const PORT = process.env.PORT || 5000;

// --- Core Middleware ---

// ===================================================================
//      >>>>>  إعدادات CORS مع كود تشخيصي لكشف المصدر  <<<<<
// ===================================================================
const allowedOrigins = [
  'https://your-placeholder-url.vercel.app', // اترك هذا الرابط كنموذج مؤقتًا
  'http://localhost:3000',
 ];

const corsOptions = {
  origin: function (origin, callback) {
    // --- تحديث مهم لتصحيح الأخطاء ---
    // سنقوم بطباعة مصدر الطلب في كل مرة للتحقق منه
    console.log(`>> CORS Check: Request received from origin: ${origin}`); 

    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // سنطبع رسالة خطأ توضح المصدر المرفوض بالضبط
      callback(new Error(`سياسة CORS لا تسمح بالوصول من المصدر: ${origin}`));
    }
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
};


 app.use(cors(corsOptions));
// ===================================================================


app.use(express.json());

// --- Database Connection ---
mongoose.connect(process.env.DATABASE_URL)
  .then(() => console.log('Successfully connected to MongoDB Atlas'))
  .catch((err) => console.error('MongoDB connection error:', err.message));

// --- (باقي الكود كما هو بدون تغيير) ---
require('./models/Inventory');
const Notification = require('./models/Notification');
 const Inventory = mongoose.model('Inventory');
const authRoutes = require('./routes/auth');
const inventoryRoutes = require('./routes/inventory');
const dashboardRoutes = require('./routes/dashboard');
const deliveryRoutes = require('./routes/delivery');
const notificationRoutes = require('./routes/notifications');
 const reportRoutes = require('./routes/reports');
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
cron.schedule('0 8 * * *', async () => { /* ... */ }, { timezone: "Asia/Riyadh" });
app.listen(PORT, () => { console.log(`Server is running on port ${PORT}`); });