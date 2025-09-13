// server.js (النسخة المحدثة)

// Import core packages
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const cron = require('node-cron'); // --- جديد ---: مكتبة المهام المجدولة


// Initialize the app
const app = express();
const PORT = process.env.PORT || 5000;

 // --- Core Middleware ---
app.use(cors({
  origin: "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  preflightContinue: false,
  optionsSuccessStatus: 204
} ));
app.use(express.json());

// --- Database Connection ---
mongoose.connect(process.env.DATABASE_URL)
  .then(() => console.log('Successfully connected to MongoDB Atlas'))
  .catch((err) => console.error('MongoDB connection error:', err.message));

// --- تسجيل نماذج Mongoose ---
// من الجيد تسجيل كل النماذج هنا لضمان توفرها في التطبيق
require('./models/Inventory'); // افترض أن هذا هو موديل المخزون لديك
const Notification = require('./models/Notification'); // --- جديد ---
const Inventory = mongoose.model('Inventory'); // --- جديد ---: استدعاء الموديل المسجل


// --- API Routes ---
// Import route handlers
const authRoutes = require('./routes/auth');
const inventoryRoutes = require('./routes/inventory');
const dashboardRoutes = require('./routes/dashboard');
const deliveryRoutes = require('./routes/delivery');
const notificationRoutes = require('./routes/notifications'); // --- جديد ---
const reportRoutes = require('./routes/reports'); // --- جديد ---
const uniformsRoutes = require('./routes/uniforms');


// Mount route handlers to specific API paths
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/notifications', notificationRoutes); // --- جديد ---
app.use('/api/reports', reportRoutes); // --- جديد ---
app.use('/api/uniforms', uniformsRoutes);

// --- جديد ---: المهمة المجدولة لفحص المخزون المنخفض
// سيتم تشغيل هذا الكود كل يوم الساعة 8 صباحاً بتوقيت السيرفر
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
    timezone: "Asia/Riyadh" // تحديد المنطقة الزمنية للمملكة العربية السعودية
});


// --- Start Server ---
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 