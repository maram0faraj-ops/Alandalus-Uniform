// server.js (النسخة الكاملة والنهائية للتشخيص)

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
  // سنترك هذا الرابط المؤقت فقط لتشغيل الكود التشخيصي
  'https://placeholder-for-debugging.com', 
  'http://localhost:3000',
];

const corsOptions = {
  origin: function (origin, callback) {
    // هذا السطر سيطبع في سجلات Render مصدر الطلب الحقيقي في كل مرة
    console.log(`>> CORS Check: Request received from origin: ${origin}`); 

    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // هذه الرسالة ستظهر في سجلات Render وتحتوي على الرابط الصحيح
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

// --- Mongoose Models Registration ---
require('./models/Inventory');
const Notification = require('./models/Notification');
const Inventory = mongoose.model('Inventory');

// --- API Routes ---
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

// --- Scheduled Job ---
cron.schedule('0 8 * * *', async () => {
  console.log('CRON: Running a daily low stock check...');
  const lowStockThreshold = 20;
  try {
    const lowStockItems = await Inventory.find({ quantity: { $lt: lowStockThreshold } });
    for (const item of lowStockItems) {
      const existingNotification = await Notification.findOne({ item: item._id, isRead: false });
      if (!existingNotification) {
        const message = `تنبيه: مخزون الصنف "${item.name}" منخفض. الكمية المتبقية: ${item.quantity}`;
        await Notification.create({ message, item: item._id });
        console.log(`CRON: Notification created for item: ${item.name}`);
      }
    }
  } catch (error) {
    console.error('CRON ERROR: Error during daily stock check:', error);
  }
}, {
    timezone: "Asia/Riyadh"
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});