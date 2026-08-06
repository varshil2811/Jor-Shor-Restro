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

import MenuItem from './models/MenuItem.js';
import GalleryImage from './models/GalleryImage.js';
import Reservation from './models/Reservation.js';
import Review from './models/Review.js';

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

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '-'));
  }
});
const upload = multer({ storage });

// Middleware
app.use(cors());
app.use(express.json());
// Serve static files from uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database Connection
mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// --- Menu Routes ---

// Get all menu items
app.get('/api/menu', async (req, res) => {
  try {
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
        imageUrl: item.imageUrl ? `http://localhost:${PORT}/uploads/${item.imageUrl}` : null
      });
      return acc;
    }, {});

    // Convert object to array format that frontend expects
    const formattedData = Object.keys(groupedData).map(category => ({
      category,
      items: groupedData[category]
    }));

    if (formattedData.length === 0) {
       return res.json([
         { category: 'SOUP', items: [] },
         { category: 'APPETIZER', items: [] },
         { category: 'CHAAT', items: [] },
         { category: 'BEVERAGES', items: [] }
       ]);
    }

    res.json(formattedData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get raw items for Admin panel table
app.get('/api/admin/menu', async (req, res) => {
  try {
    const items = await MenuItem.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a new menu item
app.post('/api/menu', upload.single('image'), async (req, res) => {
  try {
    const itemData = { ...req.body };
    if (req.file) {
      itemData.imageUrl = req.file.filename;
    }
    const newItem = new MenuItem(itemData);
    const savedItem = await newItem.save();
    res.status(201).json(savedItem);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update a menu item
app.put('/api/menu/:id', upload.single('image'), async (req, res) => {
  try {
    const itemData = { ...req.body };
    if (req.file) {
      itemData.imageUrl = req.file.filename;
    }
    const updatedItem = await MenuItem.findByIdAndUpdate(
      req.params.id,
      itemData,
      { new: true, runValidators: true }
    );
    if (!updatedItem) return res.status(404).json({ error: 'Item not found' });
    res.json(updatedItem);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a menu item
app.delete('/api/menu/:id', async (req, res) => {
  try {
    const deletedItem = await MenuItem.findByIdAndDelete(req.params.id);
    if (!deletedItem) return res.status(404).json({ error: 'Item not found' });
    
    // Optionally delete the image file if it exists
    if (deletedItem.imageUrl) {
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

// --- Gallery Routes ---

// Get all gallery images
app.get('/api/gallery', async (req, res) => {
  try {
    const images = await GalleryImage.find().sort({ createdAt: -1 });
    const formattedImages = images.map(img => ({
      id: img._id,
      url: `http://localhost:${PORT}/uploads/${img.imageUrl}`
    }));
    res.json(formattedImages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload a new gallery image
app.post('/api/gallery', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }
    
    const newImage = new GalleryImage({ imageUrl: req.file.filename });
    const savedImage = await newImage.save();
    
    res.status(201).json({
      id: savedImage._id,
      url: `http://localhost:${PORT}/uploads/${savedImage.imageUrl}`
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a gallery image
app.delete('/api/gallery/:id', async (req, res) => {
  try {
    const deletedImage = await GalleryImage.findByIdAndDelete(req.params.id);
    if (!deletedImage) return res.status(404).json({ error: 'Image not found' });
    
    const filePath = path.join(__dirname, 'uploads', deletedImage.imageUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    res.json({ message: 'Image deleted successfully' });
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

app.get('/api/reservations', async (req, res) => {
  try {
    const reservations = await Reservation.find().sort({ createdAt: -1 });
    res.json(reservations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/reservations/:id', async (req, res) => {
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

app.delete('/api/reservations/:id', async (req, res) => {
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
app.put('/api/reviews/:id', async (req, res) => {
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
app.delete('/api/reviews/:id', async (req, res) => {
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
