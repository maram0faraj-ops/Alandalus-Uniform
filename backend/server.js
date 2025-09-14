// server.js (النسخة النهائية)

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const cron = require('node-cron');
const Notification = require('./models/Notification');
const Inventory = require('./models/Inventory');

const app = express();
const PORT = process.env.PORT || 5000;

// --- إعدادات CORS الديناميكية والآمنة ---
const allowedOrigins = [
    'https://alandalus-uniform-maram-faraj-alshammris-projects.vercel.app' // رابط النشر الرئيسي
];

const corsOptions = {
    origin: function (origin, callback) {
        // السماح بالوصول إذا كان الرابط في القائمة البيضاء،
        // أو إذا كان يطابق نمط روابط النشر المؤقتة من Vercel،
        // أو إذا لم يكن هناك origin (مثل أدوات الاختبار)
        if (!origin || allowedOrigins.indexOf(origin) !== -1 || /--maram-faraj-alshammris-projects\.vercel\.app$/.test(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
};

app.use(cors(corsOptions));
// --- نهاية إعدادات CORS ---

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

// --- المهمة المجدولة (تبقى كما هي) ---
cron.schedule('0 8 * * *', async () => { 
    console.log('Running daily low stock check...');
    // ... add cron job logic here if needed ...
}, { timezone: "Asia/Riyadh" });

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});