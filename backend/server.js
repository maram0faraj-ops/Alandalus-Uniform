// server.js (النسخة الكاملة والصحيحة)

// Import core packages
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const cron = require('node-cron');
const Notification = require('./models/Notification');
const Inventory = require('./models/Inventory');

// Initialize the app
const app = express();
const PORT = process.env.PORT || 5000;

 // --- Core Middleware ---

// --- تم تعديل إعدادات CORS هنا ---
// تحديد رابط الواجهة الأمامية بشكل صريح
app.use(cors({
  origin: "https://alandalus-uniform-gbxhkf5jb-maram-faraj-alshammris-projects.vercel.app",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  preflightContinue: false,
  optionsSuccessStatus: 204
}));
// --- نهاية التعديل ---

app.use(express.json());

// --- Database Connection ---
mongoose.connect(process.env.DATABASE_URL)
  .then(() => console.log('Successfully connected to MongoDB Atlas'))
  .catch((err) => console.error('MongoDB connection error:', err.message));

// --- API Routes ---
const authRoutes = require('./routes/auth');
const inventoryRoutes = require('./routes/inventory');
const dashboardRoutes = require('./routes/dashboard');
const deliveryRoutes = require('./routes/delivery');
const notificationRoutes = require('./routes/notifications');
const reportRoutes = require('./routes/reports');
const uniformsRoutes = require('./routes/uniforms');

app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/uniforms', uniformsRoutes);

// --- المهمة المجدولة لفحص المخزون المنخفض ---
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

// --- تم حذف القوس الزائد من هنا ---