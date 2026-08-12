import mongoose from 'mongoose';

const galleryImageSchema = new mongoose.Schema({
  imageUrl: {
    type: String,
    required: true,
  },
  publicId: {
    type: String,
    required: false,
  }
}, { timestamps: true });

const GalleryImage = mongoose.model('GalleryImage', galleryImageSchema);

export default GalleryImage;
