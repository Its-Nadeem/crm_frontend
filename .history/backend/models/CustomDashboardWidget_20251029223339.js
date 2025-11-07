import mongoose from 'mongoose';

const customDashboardWidgetSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  chartType: {
    type: String,
    enum: ['bar', 'pie', 'line', 'stat'],
    required: true
  },
  metric: {
    type: String,
    enum: ['lead_count', 'deal_value_sum', 'deal_value_avg'],
    required: true
  },
  dimension: {
    type: String,
    enum: ['source', 'assignedToId', 'stage', 'createdAt_month', 'campaign'],
    required: true
  },
  organizationId: {
    type: String,
    required: true
  },
  userId: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
customDashboardWidgetSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index for efficient queries
customDashboardWidgetSchema.index({ organizationId: 1, userId: 1 });

const CustomDashboardWidget = mongoose.model('CustomDashboardWidget', customDashboardWidgetSchema);

export default CustomDashboardWidget;