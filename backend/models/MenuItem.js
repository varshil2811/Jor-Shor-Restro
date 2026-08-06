import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  desc: {
    type: String,
    required: true,
  },
  price: {
    type: String,
    required: true,
  },
  type: {
    type: String, // 'veg' or 'non-veg'
    required: true,
    enum: ['veg', 'non-veg']
  },
  spice: {
    type: Number, // 0, 1, 2, 3
    default: 0
  },
  imageUrl: {
    type: String,
    default: null
  }
}, { timestamps: true });

export default mongoose.model('MenuItem', menuItemSchema);
