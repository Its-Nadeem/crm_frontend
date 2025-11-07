const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  avatar: { type: String, default: '' },
  phone: { type: String },
  role: {
    type: String,
    enum: ['Super Admin', 'Admin', 'Manager', 'Sales Rep'],
    required: true
  },
  teamId: { type: String },
  permissions: [{ type: String }],
  isTrackingEnabled: { type: Boolean, default: true },
  organizationId: { type: String, required: true },
  superAdminRole: {
    type: String,
    enum: ['Co-Owner', 'Finance Admin', 'Support Admin']
  },
  // Column preferences for leads table
  leadColumnPreferences: {
    columnOrder: [{ type: String }],
    visibleColumns: { type: Object, default: {} }
  }
}, {
  timestamps: true
});

export default mongoose.model('User', userSchema);
