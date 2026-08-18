import { useState } from 'react';
import './ReservationContact.css';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { useInView } from '../hooks/useInView';

const ReservationContact = () => {
  const [formData, setFormData] = useState({
    name: '', phone: '', email: '',
    date: '', time: '', guests: '2', requests: ''
  });
  const [status, setStatus] = useState(null);
  const [headerRef, headerVisible] = useInView(0.2);
  const [formRef,   formVisible]   = useInView(0.1);
  const [infoRef,   infoVisible]   = useInView(0.1);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';
      const res = await fetch(`${API_URL}/reservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setStatus('success');
        setFormData({ name:'', phone:'', email:'', date:'', time:'', guests:'2', requests:'' });
        setTimeout(() => setStatus(null), 5000);
      }
    } catch (err) {
      console.error('Error submitting reservation:', err);
    }
  };

  return (
    <section id="contact" className="section contact-section">
      <div className="container">

        {/* ── section header ── */}
        <div className={`contact-section-header reveal ${headerVisible ? 'visible' : ''}`} ref={headerRef}>
          <p className="contact-eyebrow">Book Your Experience</p>
          <h2 className="section-title">Reserve &amp; Contact</h2>
          <p className="contact-section-subtext">Secure your table online — we'll confirm within the hour.</p>
        </div>

        <div className="contact-grid">

          {/* ── LEFT: glass form ── */}
          <div className={`reservation-form-container reveal from-left ${formVisible ? 'visible' : ''}`} ref={formRef}>
            <h3 className="form-card-title">Reserve a Table</h3>
            <p className="form-subtitle">For parties larger than 10, please call us directly.</p>

            {status === 'success' && (
              <div className="alert success">
                ✓ Reservation received! We'll confirm shortly.
              </div>
            )}

            <form onSubmit={handleSubmit} className="reservation-form">

              {/* Full Name */}
              <div className="form-group">
                <label htmlFor="name">Full Name *</label>
                <input
                  type="text" id="name" name="name" required
                  placeholder="Your full name"
                  value={formData.name} onChange={handleChange}
                />
              </div>

              {/* Phone + Email */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="phone">Phone *</label>
                  <input
                    type="tel" id="phone" name="phone" required
                    pattern="[0-9]{10}" title="10-digit mobile number"
                    placeholder="9876543210"
                    value={formData.phone} onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email" id="email" name="email"
                    placeholder="you@email.com"
                    value={formData.email} onChange={handleChange}
                  />
                </div>
              </div>

              {/* Date + Time + Guests */}
              <div className="form-row-three">
                <div className="form-group">
                  <label htmlFor="date">Date *</label>
                  <input type="date" id="date" name="date" required value={formData.date} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label htmlFor="time">Time *</label>
                  <input type="time" id="time" name="time" required value={formData.time} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label htmlFor="guests">Guests *</label>
                  <input 
                    type="number" 
                    id="guests" 
                    name="guests" 
                    min="1"
                    placeholder="Enter number of guests"
                    required 
                    value={formData.guests} 
                    onChange={handleChange} 
                  />
                </div>
              </div>

              {/* Special Requests */}
              <div className="form-group">
                <label htmlFor="requests">Special Requests</label>
                <textarea
                  id="requests" name="requests" rows="2"
                  placeholder="Allergies, anniversaries, seating preferences…"
                  value={formData.requests} onChange={handleChange}
                />
              </div>

              <button type="submit" className="btn btn-primary btn-block">
                Confirm Reservation
              </button>

            </form>
          </div>

          {/* ── RIGHT: info + map ── */}
          <div className={`contact-info-container reveal from-right ${infoVisible ? 'visible' : ''}`} ref={infoRef}>

            <div className="contact-info-card">
              <h3 className="contact-info-title">Find Us</h3>
              <div className="contact-details">

                <div className="contact-item">
                  <div className="contact-icon"><MapPin size={18} /></div>
                  <div>
                    <h4>Location</h4>
                    <p>Pramukh Arcade 2, Kudasan,<br />Gandhinagar, Gujarat 382421</p>
                  </div>
                </div>

                <div className="contact-item">
                  <div className="contact-icon"><Phone size={18} /></div>
                  <div>
                    <h4>Phone</h4>
                    <p><a href="tel:+919876543210">+91 98765 43210</a></p>
                  </div>
                </div>

                <div className="contact-item">
                  <div className="contact-icon"><Mail size={18} /></div>
                  <div>
                    <h4>Email</h4>
                    <p><a href="mailto:hello@jorshor.com">hello@jorshor.com</a></p>
                  </div>
                </div>

                <div className="contact-item">
                  <div className="contact-icon"><Clock size={18} /></div>
                  <div>
                    <h4>Hours</h4>
                    <p>Mon – Sun: 11:00 AM – 11:00 PM</p>
                  </div>
                </div>

              </div>
            </div>

            {/* Map */}
            <a 
              href="https://maps.google.com/?q=Jor+Shor+Restro,+Pramukh+Arcade+2,+Kudasan,+Gandhinagar,+Gujarat+382421" 
              target="_blank" 
              rel="noreferrer" 
              className="map-card"
            >
              <div className="map-overlay"></div>
              <div className="map-content">
                <MapPin size={40} className="map-pin-icon" />
                <h3>Get Directions</h3>
                <p>Pramukh Arcade 2, Kudasan, Gandhinagar</p>
              </div>
            </a>

          </div>

        </div>
      </div>
    </section>
  );
};

export default ReservationContact;
