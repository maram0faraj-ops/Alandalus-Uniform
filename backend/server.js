// server.js (النسخة النهائية والصحيحة)
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 5000;

// --- إعدادات CORS النهائية والصحيحة ---
const allowedOrigins = [
  'https://alandalus-uniform-maram-faraj-alshammaris-projects.vercel.app/login', // رابط Vercel الصحيح
  'http://localhost:3000',
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('هذا النطاق غير مسموح به بواسطة سياسة CORS'));
    }
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// --- باقي الكود (اتركه كما هو) ---
mongoose.connect(process.env.DATABASE_URL).then(/* ... */).catch(/* ... */);
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