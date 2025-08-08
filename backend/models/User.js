const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true // Ensure email is stored in lowercase
  },
  password: { 
    type: String, 
    required: true 
  },
  phoneNumber: { 
    type: String 
  },
  role: {
    type: String,
    enum: ['admin', 'staff', 'parent'], // Allowed roles
    default: 'staff',
  },
}, { timestamps: true }); // Add createdAt and updatedAt fields automatically

// Hash password before saving the user document
UserSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('User', UserSchema);
