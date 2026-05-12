const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// استبدلي هذا الرابط برابط الـ Cluster الجديد الخاص بكِ (مع كلمة المرور الصحيحة)
const MONGODB_URI = "mongodb+srv://alandalus_user:NewPass2050@cluster0.6gks6nf.mongodb.net/?appName=Cluster0";

// تعريف موديل المستخدم مباشرة داخل السكربت لتجنب أخطاء المسارات
const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'admin' }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

const seedAdmin = async () => {
    try {
        console.log("⏳ جاري الاتصال بـ MongoDB Atlas...");
        await mongoose.connect(MONGODB_URI);
        console.log("✅ متصل بنجاح!");

        const adminEmail = "admin@andalus.edu.sa";
        const hashedPassword = await bcrypt.hash("AndalusPassword2026", 10);

        const adminUser = new User({
            name: "المسؤول العام",
            email: adminEmail,
            password: hashedPassword,
            role: "admin"
        });

        await adminUser.save();
        console.log("🚀 تم إنشاء حساب المسؤول بنجاح!");
        console.log("📧 البريد: " + adminEmail);
        
    } catch (err) {
        console.error("❌ حدث خطأ:");
        console.error(err.message);
    } finally {
        mongoose.connection.close();
        process.exit();
    }
};

seedAdmin();