// Import core packages
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Initialize the app
const app = express();
const PORT = process.env.PORT || 5000;

// --- Core Middleware ---
// Enable Cross-Origin Resource Sharing for all routes
app.use(cors({
  origin: "*", // Allow requests from any origin
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  preflightContinue: false,
  optionsSuccessStatus: 204
}));
// Parse incoming JSON requests
app.use(express.json());

// --- Database Connection ---
mongoose.connect(process.env.DATABASE_URL)
  .then(() => console.log('Successfully connected to MongoDB Atlas'))
  .catch((err) => console.error('MongoDB connection error:', err.message));

  // --- API Routes ---
// Import route handlers
const authRoutes = require('./routes/auth');
const inventoryRoutes = require('./routes/inventory');
const dashboardRoutes = require('./routes/dashboard');
const deliveryRoutes = require('./routes/delivery');

// =================================================================
//      >>>>>  تأكد من وجود هذا الجزء وتصحيح المسارات  <<<<<
//           الحل النهائي: تسجيل النماذج هنا
// =================================================================
require('./models/Uniform'); // تأكد من أن المسار صحيح لملف نموذج الزي
require('./models/Inventory'); // من الأفضل تسجيل كل النماذج هنا
// =================================================================

// Mount route handlers to specific API paths
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/delivery', deliveryRoutes);

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
