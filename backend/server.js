import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import { v2 as cloudinary } from 'cloudinary';

import Category from './models/Category.js';
import MenuItem from './models/MenuItem.js';
import GalleryImage from './models/GalleryImage.js';
import GalleryReel from './models/GalleryReel.js';
import Reservation from './models/Reservation.js';
import Review from './models/Review.js';
import Setting from './models/Setting.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/jorshor';

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir);
}

// Nodemailer Transporter Setup (Real SMTP via .env)
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_SERVER,
  port: process.env.MAIL_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
  },
});

transporter.verify().then(() => {
  console.log('SMTP connection established successfully');
}).catch(console.error);

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Helper function to upload buffer to Cloudinary
const uploadToCloudinary = (buffer, folder, resourceType = 'auto') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: folder, resource_type: resourceType },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
};

// Multer Storage Configuration
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Middleware
app.use(cors());
app.use(express.json());
// Serve static files from uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database Connection
mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Auto-seed Categories from existing MenuItems if empty
    try {
      const categoryCount = await Category.countDocuments();
      if (categoryCount === 0) {
        const items = await MenuItem.find();
        const uniqueCategories = [...new Set(items.map(i => i.category))];
        if (uniqueCategories.length > 0) {
          for (const catName of uniqueCategories) {
            await new Category({ name: catName }).save();
          }
          console.log(`Seeded ${uniqueCategories.length} categories from existing items.`);
        } else {
          // If no items at all, seed default
          const defaultCats = ['SOUP', 'APPETIZER', 'MAIN COURSE', 'DESSERT', 'BEVERAGES'];
          for (const catName of defaultCats) {
            await new Category({ name: catName }).save();
          }
          console.log(`Seeded default categories.`);
        }
      }
    } catch (err) {
      console.error('Failed to seed categories:', err);
    }
    
    // Auto-seed Reviews from hardcoded dummy data if missing
    try {
      const hasDefault = await Review.findOne({ name: 'Rahul Desai' });
      if (!hasDefault) {
        const defaultReviews = [
          { name: 'Rahul Desai', rating: 5, text: 'My family loved the dinner. Rich flavors, warm service, and a perfect premium dining experience.', status: 'Approved' },
          { name: 'Sneha Patel', rating: 5, text: 'Amazing quality and beautifully plated food. Everything arrived fresh and exactly on time.', status: 'Approved' },
          { name: 'Amit Shah', rating: 5, text: 'A very aesthetic and pleasant ambience. Their starters are out of this world. Highly recommend!', status: 'Approved' }
        ];
        await Review.insertMany(defaultReviews);
        console.log('Seeded default reviews.');
      }
    } catch (err) {
      console.error('Failed to seed reviews:', err);
    }
  })
  .catch((err) => console.error('MongoDB connection error:', err));

// --- Authentication Middleware ---
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.admin = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

// --- Auth Routes ---
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  ) {
    const token = jwt.sign({ username }, process.env.JWT_SECRET || 'secret', { expiresIn: '24h' });
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.post('/api/admin/change-password', authMiddleware, (req, res) => {
  const { newUsername, newPassword } = req.body;
  if (!newUsername || !newPassword) {
    return res.status(400).json({ error: 'New username and password are required' });
  }

  try {
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
      let envFile = fs.readFileSync(envPath, 'utf8');
      
      envFile = envFile.replace(/^ADMIN_USERNAME=.*$/m, `ADMIN_USERNAME=${newUsername}`);
      envFile = envFile.replace(/^ADMIN_PASSWORD=.*$/m, `ADMIN_PASSWORD=${newPassword}`);
      
      // If they were not present, append them
      if (!/^ADMIN_USERNAME=/m.test(envFile)) envFile += `\nADMIN_USERNAME=${newUsername}`;
      if (!/^ADMIN_PASSWORD=/m.test(envFile)) envFile += `\nADMIN_PASSWORD=${newPassword}`;
      
      fs.writeFileSync(envPath, envFile);
    }
    
    // Update process.env for current runtime
    process.env.ADMIN_USERNAME = newUsername;
    process.env.ADMIN_PASSWORD = newPassword;
    
    res.json({ message: 'Credentials updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update credentials' });
  }
});

// --- Menu Routes ---

// Get all menu items mapped by defined Categories
app.get('/api/menu', async (req, res) => {
  console.log('GET /api/menu called');
  try {
    const categories = await Category.find().sort({ createdAt: 1 });
    const items = await MenuItem.find().sort({ createdAt: -1 });
    
    // Group items by category to match the frontend structure easily
    const groupedData = items.reduce((acc, item) => {
      const category = item.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push({
        id: item._id, // map _id to id for frontend
        name: item.name,
        desc: item.desc,
        price: item.price,
        type: item.type,
        spice: item.spice,
        imageUrl: item.imageUrl ? (item.imageUrl.startsWith('http') ? item.imageUrl : `http://localhost:${PORT}/uploads/${item.imageUrl}`) : null
      });
      return acc;
    }, {});

    // Ensure all defined categories exist in output, even if empty
    const formattedData = categories.map(cat => ({
      id: cat._id,
      category: cat.name,
      items: groupedData[cat.name] || []
    }));

    res.json(formattedData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Categories Routes ---

// Get all categories
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: 1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new category
app.post('/api/categories', authMiddleware, async (req, res) => {
  try {
    if (!req.body.name) return res.status(400).json({ error: 'Category name required' });
    const newCategory = new Category({ name: req.body.name });
    const saved = await newCategory.save();
    res.status(201).json(saved);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ error: 'Category already exists' });
    res.status(500).json({ error: err.message });
  }
});

// Delete category
app.delete('/api/categories/:id', authMiddleware, async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get raw items for Admin panel table
app.get('/api/admin/menu', authMiddleware, async (req, res) => {
  try {
    const items = await MenuItem.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a new menu item
app.post('/api/menu', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const itemData = { ...req.body };
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, 'jorshor/menu');
      itemData.imageUrl = result.secure_url;
      itemData.publicId = result.public_id;
    }
    const newItem = new MenuItem(itemData);
    const savedItem = await newItem.save();
    res.status(201).json(savedItem);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update a menu item
app.put('/api/menu/:id', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const itemData = { ...req.body };
    const currentItem = await MenuItem.findById(req.params.id);
    if (!currentItem) return res.status(404).json({ error: 'Item not found' });

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, 'jorshor/menu');
      itemData.imageUrl = result.secure_url;
      itemData.publicId = result.public_id;
      
      if (currentItem.publicId) {
        await cloudinary.uploader.destroy(currentItem.publicId);
      }
    }
    const updatedItem = await MenuItem.findByIdAndUpdate(
      req.params.id,
      itemData,
      { new: true, runValidators: true }
    );
    res.json(updatedItem);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a menu item
app.delete('/api/menu/:id', authMiddleware, async (req, res) => {
  try {
    const deletedItem = await MenuItem.findByIdAndDelete(req.params.id);
    if (!deletedItem) return res.status(404).json({ error: 'Item not found' });
    
    if (deletedItem.publicId) {
      await cloudinary.uploader.destroy(deletedItem.publicId);
    } else if (deletedItem.imageUrl && !deletedItem.imageUrl.startsWith('http')) {
      const filePath = path.join(__dirname, 'uploads', deletedItem.imageUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    res.json({ message: 'Item deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Settings Routes ---

// Get a setting by key
app.get('/api/settings/:key', async (req, res) => {
  try {
    const setting = await Setting.findOne({ key: req.params.key });
    if (!setting) return res.status(404).json({ error: 'Setting not found' });
    res.json({ key: setting.key, value: setting.value });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload Menu File and save to setting
app.post('/api/settings/menu-pdf', authMiddleware, upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'File is required' });
    
    const ext = path.extname(req.file.originalname) || '.pdf';
    
    // Upload File to Cloudinary with explicit extension
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { 
          folder: 'jorshor/settings', 
          resource_type: 'auto',
          public_id: `menu_${Date.now()}${ext}`
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });
    
    // Update or create setting
    const setting = await Setting.findOneAndUpdate(
      { key: 'menu_pdf' },
      { value: result.secure_url },
      { upsert: true, new: true }
    );
    
    res.json(setting);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Gallery Routes ---

// Get all gallery images
app.get('/api/gallery', async (req, res) => {
  try {
    const images = await GalleryImage.find().sort({ createdAt: -1 });
    const formattedImages = images.map(img => ({
      id: img._id,
      url: img.imageUrl.startsWith('http') ? img.imageUrl : `http://localhost:${PORT}/uploads/${img.imageUrl}`
    }));
    res.json(formattedImages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload a new gallery image
app.post('/api/gallery', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }
    
    const result = await uploadToCloudinary(req.file.buffer, 'jorshor/gallery');
    
    const newImage = new GalleryImage({ 
      imageUrl: result.secure_url,
      publicId: result.public_id
    });
    const savedImage = await newImage.save();
    
    res.status(201).json({
      id: savedImage._id,
      url: savedImage.imageUrl
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a gallery image
app.delete('/api/gallery/:id', authMiddleware, async (req, res) => {
  try {
    const deletedImage = await GalleryImage.findByIdAndDelete(req.params.id);
    if (!deletedImage) return res.status(404).json({ error: 'Image not found' });
    
    if (deletedImage.publicId) {
      await cloudinary.uploader.destroy(deletedImage.publicId);
    } else if (deletedImage.imageUrl && !deletedImage.imageUrl.startsWith('http')) {
      const filePath = path.join(__dirname, 'uploads', deletedImage.imageUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    res.json({ message: 'Image deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Reels Routes ---

// Get all reels
app.get('/api/reels', async (req, res) => {
  try {
    const reels = await GalleryReel.find().sort({ createdAt: -1 });
    const formattedReels = reels.map(r => ({
      id: r._id,
      title: r.title,
      url: r.videoUrl
    }));
    res.json(formattedReels);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload a new reel
app.post('/api/reels', authMiddleware, upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video uploaded' });
    }
    
    const result = await uploadToCloudinary(req.file.buffer, 'jorshor/reels', 'video');
    
    const newReel = new GalleryReel({
      title: req.body.title || '',
      videoUrl: result.secure_url,
      publicId: result.public_id
    });
    const savedReel = await newReel.save();
    
    res.status(201).json({
      id: savedReel._id,
      title: savedReel.title,
      url: savedReel.videoUrl
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a reel
app.delete('/api/reels/:id', authMiddleware, async (req, res) => {
  try {
    const deletedReel = await GalleryReel.findByIdAndDelete(req.params.id);
    if (!deletedReel) return res.status(404).json({ error: 'Reel not found' });
    
    if (deletedReel.publicId) {
      await cloudinary.uploader.destroy(deletedReel.publicId, { resource_type: 'video' });
    }
    
    res.json({ message: 'Reel deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Reservation Routes ---

app.post('/api/reservations', async (req, res) => {
  try {
    const newReservation = new Reservation(req.body);
    const savedReservation = await newReservation.save();
    
    // Send email to owner
    if (transporter) {
      const mailOptions = {
        from: `"Jor Shor Booking System" <${process.env.MAIL_FROM}>`,
        to: process.env.MAIL_USERNAME, // Send to the owner
        subject: `New Reservation Request - ${savedReservation.name}`,
        html: `
          <h3>New Reservation Request Received!</h3>
          <p><strong>Name:</strong> ${savedReservation.name}</p>
          <p><strong>Phone:</strong> ${savedReservation.phone}</p>
          <p><strong>Email:</strong> ${savedReservation.email || 'N/A'}</p>
          <p><strong>Date & Time:</strong> ${savedReservation.date} at ${savedReservation.time}</p>
          <p><strong>Guests:</strong> ${savedReservation.guests}</p>
          <p><strong>Special Requests:</strong> ${savedReservation.requests || 'None'}</p>
          <p>Please check the Admin Panel to confirm this booking.</p>
        `
      };
      
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Error sending owner email:', error);
        } else {
          console.log('New Reservation Email sent to owner:', info.messageId);
        }
      });
    }

    res.status(201).json(savedReservation);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/reservations', authMiddleware, async (req, res) => {
  try {
    const reservations = await Reservation.find().sort({ createdAt: -1 });
    res.json(reservations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/reservations/:id', authMiddleware, async (req, res) => {
  try {
    const updatedReservation = await Reservation.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    );
    if (!updatedReservation) return res.status(404).json({ error: 'Reservation not found' });
    
    // If status changed to Confirmed, send email to user
    if (req.body.status === 'Confirmed' && transporter && updatedReservation.email) {
      const mailOptions = {
        from: `"Jor Shor Restro" <${process.env.MAIL_FROM}>`,
        to: updatedReservation.email,
        subject: `Your Reservation is Confirmed! - Jor Shor`,
        html: `
          <h3>Hello ${updatedReservation.name},</h3>
          <p>Great news! Your table at Jor Shor Restro has been successfully booked.</p>
          <h4>Reservation Details:</h4>
          <ul>
            <li><strong>Date:</strong> ${updatedReservation.date}</li>
            <li><strong>Time:</strong> ${updatedReservation.time}</li>
            <li><strong>Guests:</strong> ${updatedReservation.guests}</li>
          </ul>
          <p>We look forward to serving you!</p>
          <p>Best regards,<br>Jor Shor Restro Team</p>
        `
      };
      
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Error sending confirmation email:', error);
        } else {
          console.log('Confirmation Email sent to customer:', info.messageId);
        }
      });
    }

    res.json(updatedReservation);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/reservations/:id', authMiddleware, async (req, res) => {
  try {
    const deletedReservation = await Reservation.findByIdAndDelete(req.params.id);
    if (!deletedReservation) return res.status(404).json({ error: 'Reservation not found' });
    res.json({ message: 'Reservation deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- Review Routes ---

// Get reviews (User requested all reviews to show without admin approval)
app.get('/api/reviews', async (req, res) => {
  try {
    const reviews = await Review.find({}).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit a new review
app.post('/api/reviews', async (req, res) => {
  try {
    const newReview = new Review(req.body);
    const savedReview = await newReview.save();
    res.status(201).json(savedReview);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update review status
app.put('/api/reviews/:id', authMiddleware, async (req, res) => {
  try {
    const updatedReview = await Review.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    );
    if (!updatedReview) return res.status(404).json({ error: 'Review not found' });
    res.json(updatedReview);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a review
app.delete('/api/reviews/:id', authMiddleware, async (req, res) => {
  try {
    const deletedReview = await Review.findByIdAndDelete(req.params.id);
    if (!deletedReview) return res.status(404).json({ error: 'Review not found' });
    res.json({ message: 'Review deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
