import { useEffect, useRef, useState } from 'react';
import {
  Accessibility, Truck, Sparkles, Users, UtensilsCrossed,
  Coffee, Building2, Sun, CalendarCheck, CreditCard, Baby,
  Check, Info, ChevronDown, ChevronUp
} from 'lucide-react';
import './About.css';
import { useInView } from '../hooks/useInView';

const restaurantFeatures = [
  {
    title: 'Accessibility',
    icon: Accessibility,
    items: [
      'Assistive hearing loop',
      'Wheelchair-accessible car park',
      'Wheelchair-accessible entrance',
      'Wheelchair-accessible seating',
      'Wheelchair-accessible toilet'
    ]
  },
  {
    title: 'Service Options',
    icon: Truck,
    items: ['Kerbside pickup', 'Delivery', 'On-site services', 'Takeaway', 'Dine-in']
  },
  {
    title: 'Highlights',
    icon: Sparkles,
    items: ['Great dessert']
  },
  {
    title: 'Popular For',
    icon: Users,
    items: ['Lunch', 'Dinner', 'Solo dining']
  },
  {
    title: 'Offerings',
    icon: UtensilsCrossed,
    items: [
      'All you can eat',
      'Coffee',
      'Quick bite',
      'Small plates',
      'Vegan options',
      'Vegetarian options',
      'Vegetarian options only'
    ]
  },
  {
    title: 'Dining Options',
    icon: Coffee,
    items: [
      'Breakfast',
      'Brunch',
      'Lunch',
      'Dinner',
      'Catering',
      'Counter service',
      'Dessert',
      'Seating',
      'Table service'
    ]
  },
  {
    title: 'Amenities',
    icon: Building2,
    items: ['Gender-neutral toilets', 'Restroom']
  },
  {
    title: 'Atmosphere',
    icon: Sun,
    items: ['Casual', 'Cozy', 'Quiet', 'Trendy', 'Upmarket']
  },
  {
    title: 'Crowd',
    icon: Users,
    items: ['Family friendly', 'Groups', 'LGBTQ+ friendly', 'University students']
  },
  {
    title: 'Planning',
    icon: CalendarCheck,
    items: ['Accepts reservations']
  },
  {
    title: 'Payments',
    icon: CreditCard,
    items: ['Credit cards', 'Debit cards', 'Google Pay', 'NFC mobile payments', 'Credit cards']
  },
  {
    title: 'Children',
    icon: Baby,
    items: [
      'Good for kids',
      'Good for kids birthday',
      'Has changing table(s)',
      'High chairs',
      "Kids' menu"
    ]
  }
];

const About = () => {
  const [showFeatures, setShowFeatures] = useState(false);
  const featuresRef = useRef(null);
  const [imgRef, imgVisible] = useInView(0.2);
  const [contentRef, contentVisible] = useInView(0.15);
  const [featsRef, featsVisible] = useInView(0.05);

  // Unlock page scroll if a previous modal left body overflow locked
  useEffect(() => {
    document.body.style.overflow = '';
  }, []);

  useEffect(() => {
    if (!showFeatures || !featuresRef.current) return;

    const frame = requestAnimationFrame(() => {
      featuresRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [showFeatures]);

  const toggleFeatures = () => {
    setShowFeatures((prev) => !prev);
  };

  return (
    <section id="about" className="section about-section">
      <div className="container">
        <div className="about-grid">
          <div className={`about-image-wrapper reveal from-left ${imgVisible ? 'visible' : ''}`} ref={imgRef}>
            <img
              src="https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?q=80&w=1000&auto=format&fit=crop"
              alt="Chef preparing food"
              className="about-image"
              loading="lazy"
            />
            <div className="about-experience-badge">
              <span className="years">15+</span>
              <span className="text">
                Years of
                <br />
                Excellence
              </span>
            </div>
          </div>

          <div className={`about-content reveal from-right ${contentVisible ? 'visible' : ''}`} ref={contentRef}>
            <h2 className="section-title text-left">Our Story</h2>
            <h3 className="about-subtitle">Bringing the true flavors of India to Gandhinagar</h3>

            <p className="about-text">
              Founded with a passion for authentic culinary traditions, Jor Shor Restro has been
              serving the finest Indian cuisine to food lovers in Gandhinagar. Our journey started
              with a simple belief: that great food brings people together.
            </p>

            <p className="about-text">
              We source the freshest local ingredients and blend them with spices imported directly
              from their native regions. Every dish that leaves our kitchen is a testament to our
              commitment to quality, flavor, and authenticity.
            </p>

            <div className="about-features">
              <div className="feature">
                <h4>Authentic Recipes</h4>
                <p>Generations-old traditional cooking methods.</p>
              </div>
              <div className="feature">
                <h4>Premium Ambiance</h4>
                <p>A dining experience that delights all senses.</p>
              </div>
            </div>

            <div className="about-actions">
              <a href="#contact" className="btn btn-primary">
                Visit Us Today
              </a>
              <button
                type="button"
                className="btn btn-secondary premium-btn"
                onClick={toggleFeatures}
                aria-expanded={showFeatures}
              >
                <Info size={18} />
                {showFeatures ? 'Hide Restaurant Features' : 'View Restaurant Features'}
                {showFeatures ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
            </div>
          </div>
        </div>

        {showFeatures && (
          <div
            id="restaurant-features"
            className="restaurant-insights"
            ref={featuresRef}
          >
            <div className="insights-header">
              <span className="premium-modal-eyebrow">Jor Shor Restro</span>
              <h3>Restaurant Features</h3>
              <p>
                Everything you need to know before you visit — services, amenities, and guest
                comforts.
              </p>
            </div>

            <div className={`insights-grid stagger ${featsVisible ? 'visible' : ''}`} ref={featsRef}>
              {restaurantFeatures.map((category) => {
                const Icon = category.icon;
                return (
                  <article key={category.title} className="premium-detail-card">
                    <div className="card-header-flex">
                      <div className="icon-box">
                        <Icon size={20} />
                      </div>
                      <h4>{category.title}</h4>
                    </div>
                    <ul className="premium-detail-list">
                      {category.items.map((item, index) => (
                        <li key={`${item}-${index}`} className="premium-detail-item">
                          <Check size={16} className="check-icon" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default About;
