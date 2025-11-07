import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String },
  phone: { type: String },
  role: { type: String, required: true, enum: ["Super Admin", "Admin", "Manager", "Sales Rep"] },
  teamId: { type: String },
  permissions: [{ type: String }],
  isTrackingEnabled: { type: Boolean, default: false },
  organizationId: { type: String, index: true },
  superAdminRole: { type: String, enum: ['Co-Owner', 'Finance Admin', 'Support Admin', null] }
}, { timestamps: true });

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Encrypt password using bcrypt before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});


const User = mongoose.model('User', userSchema);

export default User;



