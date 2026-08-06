import './Footer.css';
import { MapPin, Phone, Mail } from 'lucide-react';
import { FaInstagram, FaFacebook, FaWhatsapp } from 'react-icons/fa';
import Logo from './Logo';
import { useInView } from '../hooks/useInView';

const Footer = () => {
  const [gridRef, gridVisible] = useInView(0.1);

  return (
    <footer className="footer">
      <div className="container">
        <div className={`footer-grid stagger ${gridVisible ? 'visible' : ''}`} ref={gridRef}>
          
          <div className="footer-brand">
            <a href="#home" className="logo footer-logo" aria-label="Jor Shor Restro">
              <Logo className="footer-brand-logo" />
            </a>
            <p className="footer-tagline">
              Experience the true taste of tradition with our authentic Indian cuisine in the heart of Gandhinagar.
            </p>
            <div className="social-links">
              <a href="https://www.instagram.com/jorshor_restaurant_and_banquet?igsh=OTBvM21nY3pqcG42" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><FaInstagram size={20} /></a>
              <a href="https://www.facebook.com/share/14p1VzRCfz4/" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><FaFacebook size={20} /></a>
              <a href="#" aria-label="WhatsApp" className="whatsapp-link"><FaWhatsapp size={20} /></a>
            </div>
          </div>
          
          <div className="footer-links">
            <h4 className="footer-heading">Quick Links</h4>
            <ul>
              <li><a href="#home">Home</a></li>
              <li><a href="#menu">Menu</a></li>
              <li><a href="#gallery">Gallery</a></li>
              <li><a href="#about">About Us</a></li>
              <li><a href="#contact">Contact & Reservations</a></li>
            </ul>
          </div>
          
          <div className="footer-contact">
            <h4 className="footer-heading">Contact Us</h4>
            <ul className="footer-contact-list">
              <li>
                <MapPin size={18} className="footer-icon" />
                <span>Pramukh Arcade 2, Kudasan, Gandhinagar, Gujarat 382421</span>
              </li>
              <li>
                <Phone size={18} className="footer-icon" />
                <a href="tel:+919876543210">+91 98765 43210</a>
              </li>
              <li>
                <Mail size={18} className="footer-icon" />
                <a href="mailto:hello@jorshor.com">hello@jorshor.com</a>
              </li>
            </ul>
          </div>
          
          <div className="footer-hours">
            <h4 className="footer-heading">Opening Hours</h4>
            <ul>
              <li><span>Monday - Friday</span> <span>11:00 AM - 11:00 PM</span></li>
              <li><span>Saturday - Sunday</span> <span>11:00 AM - 11:30 PM</span></li>
            </ul>
          </div>
          
        </div>
        
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Jor Shor Restro. All rights reserved. <a href="/admin" style={{ opacity: 0.5, marginLeft: '10px' }}>Admin Login</a></p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
