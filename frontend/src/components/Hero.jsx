import { useEffect, useState } from 'react';
import './Hero.css';
import { ArrowRight, MapPin, Clock, Star } from 'lucide-react';

const Hero = () => {
  const [loaded, setLoaded] = useState(false);

  // Trigger entrance animation after mount
  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <section id="home" className="hero">
      <div className="hero-overlay" />

      {/* floating ambient orbs */}
      <div className="hero-orb hero-orb-1" />
      <div className="hero-orb hero-orb-2" />

      <div className="container hero-content">
        <div className={`hero-text ${loaded ? 'hero-loaded' : ''}`}>
          <span className="hero-subtitle">Authentic Indian Cuisine</span>
          <h1 className="hero-title">
            Experience the true taste of tradition at{' '}
            <span className="highlight text-shimmer">Jor Shor Restro</span>
          </h1>
          <p className="hero-desc">
            A symphony of flavors waiting for you. Dive into our culinary
            masterpieces crafted with passion and the finest ingredients.
          </p>

          <div className="hero-buttons">
            <a href="#contact" className="btn btn-primary pulse-gold">
              Book a Table
            </a>
            <a href="#menu" className="btn btn-secondary hero-btn-secondary">
              View Menu <ArrowRight size={18} style={{ marginLeft: '8px' }} />
            </a>
          </div>
        </div>
      </div>

      {/* scroll cue */}
      <div className="hero-scroll-cue">
        <div className="scroll-dot" />
      </div>

      <div className="highlights-bar">
        <div className={`container highlights-grid ${loaded ? 'stagger visible' : 'stagger'}`}>
          <div className="highlight-item">
            <Star className="highlight-icon" />
            <div>
              <strong>4.5★ Rating</strong>
              <span>1,070+ Reviews</span>
            </div>
          </div>
          <div className="highlight-item">
            <div className="highlight-icon cuisine-icon">🍽️</div>
            <div>
              <strong>Mid-tier Casual</strong>
              <span>Indian Dining</span>
            </div>
          </div>
          <div className="highlight-item">
            <MapPin className="highlight-icon" />
            <div>
              <strong>Gandhinagar</strong>
              <span>Pramukh Arcade 2</span>
            </div>
          </div>
          <div className="highlight-item">
            <Clock className="highlight-icon" />
            <div>
              <strong>Opening Hours</strong>
              <span>11:00 AM – 11:00 PM</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
