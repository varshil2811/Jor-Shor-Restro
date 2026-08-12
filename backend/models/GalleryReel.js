import mongoose from 'mongoose';

const galleryReelSchema = new mongoose.Schema({
  title: {
    type: String,
    required: false,
    trim: true,
  },
  videoUrl: {
    type: String,
    required: true,
  },
  publicId: {
    type: String,
    required: true,
  }
}, { timestamps: true });

const GalleryReel = mongoose.model('GalleryReel', galleryReelSchema);

export default GalleryReel;
