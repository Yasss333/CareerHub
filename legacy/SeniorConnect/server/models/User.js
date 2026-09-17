const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // never return by default
    },
    role: {
      type: String,
      enum: ['junior', 'senior'],
      required: [true, 'Role is required'],
    },
    avatar: {
      type: String,
      default: '',
    },
    // Junior-specific fields
    university: { type: String, trim: true, default: '' },
    year: { type: String, trim: true, default: '' },
    interests: [{ type: String, trim: true }],
    goals: [
      {
        title: { type: String, required: true },
        progress: { type: Number, min: 0, max: 100, default: 0 },
      },
    ],
    // Senior-specific fields (core identity; detail lives in SeniorProfile)
    title: { type: String, trim: true, default: '' },
    company: { type: String, trim: true, default: '' },
    location: { type: String, trim: true, default: '' },
    // Shared
    credibilityScore: { type: Number, default: 0, min: 0, max: 100 },
    badges: [{ type: String }],
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

// Instance method: verify password
userSchema.methods.verifyPassword = function (candidate) {
  return bcrypt.compare(candidate, this.passwordHash);
};

// Remove sensitive fields from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
