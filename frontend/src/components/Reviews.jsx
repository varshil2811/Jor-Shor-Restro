import { useEffect, useState } from 'react';
import './Reviews.css';
import { Star, StarHalf } from 'lucide-react';
import { useInView } from '../hooks/useInView';

const reviewsData = [
  {
    id: 1,
    name: 'Rahul Desai',
    role: 'Customers',
    rating: 5,
    text: 'My family loved the dinner. Rich flavors, warm service, and a perfect premium dining experience.'
  },
  {
    id: 2,
    name: 'Sneha Patel',
    role: 'Customers',
    rating: 5,
    text: 'Amazing quality and beautifully plated food. Everything arrived fresh and exactly on time.'
  },
  {
    id: 3,
    name: 'Amit Shah',
    role: 'Customers',
    rating: 5,
    text: 'Loved the ambience and design. We highly recommend this place for friends and family gatherings.'
  },
  {
    id: 4,
    name: 'Diana Mehta',
    role: 'Customers',
    rating: 5,
    text: 'Adorable vibe and great hospitality. The staff made us feel special and the food was excellent.'
  }
];

const renderStars = (rating) => {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;

  for (let i = 0; i < fullStars; i++) {
    stars.push(<Star key={`full-${i}`} className="star filled" size={18} fill="#b4a081" color="#b4a081" />);
  }

  if (hasHalfStar) {
    stars.push(<StarHalf key="half" className="star half" size={18} fill="#b4a081" color="#b4a081" />);
  }

  const emptyStars = 5 - Math.ceil(rating);
  for (let i = 0; i < emptyStars; i++) {
    stars.push(<Star key={`empty-${i}`} className="star empty" size={18} color="#b4a081" />);
  }

  return stars;
};

const Reviews = () => {
  const VISIBLE_REVIEWS = 3;
  const [reviews, setReviews] = useState(reviewsData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    text: '',
    rating: 5
  });
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await fetch(`${API_URL}/reviews`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setReviews(data);
          }
        }
      } catch (error) {
        console.error('Failed to fetch reviews:', error);
      }
    };
    fetchReviews();
  }, [API_URL]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedName = formData.name.trim();
    const trimmedText = formData.text.trim();
    if (!trimmedName || !trimmedText) return;

    const newReview = {
      name: trimmedName,
      role: 'Customers',
      rating: formData.rating,
      text: trimmedText
    };

    try {
      const res = await fetch(`${API_URL}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReview)
      });

      if (res.ok) {
        const savedReview = await res.json();
        setReviews((prev) => [savedReview, ...prev]);
        setFormData({ name: '', text: '', rating: 5 });
        setIsModalOpen(false);
      } else {
        console.error('Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
    }
  };

  const renderRatingPicker = () =>
    [1, 2, 3, 4, 5].map((value) => (
      <button
        key={value}
        type="button"
        className={`rating-star-btn ${formData.rating >= value ? 'active' : ''}`}
        onClick={() => setFormData((prev) => ({ ...prev, rating: value }))}
        aria-label={`Set rating to ${value} star${value > 1 ? 's' : ''}`}
      >
        <Star
          size={22}
          fill={formData.rating >= value ? '#b4a081' : 'transparent'}
          color="#b4a081"
        />
      </button>
    ));

  const hasMoreReviews = reviews.length > VISIBLE_REVIEWS;
  const visibleReviews = showAllReviews ? reviews : reviews.slice(0, VISIBLE_REVIEWS);
  const [headerRef, headerVisible] = useInView();
  const [stackRef, stackVisible] = useInView(0.05);

  return (
    <section id="reviews" className="section reviews-section">
      <div className="container">
        <div className={`text-center reveal ${headerVisible ? 'visible' : ''}`} ref={headerRef}>
          <h2 className="section-title">What Our Guests Say</h2>
          <p className="menu-subtitle">Real experiences from real people</p>
        </div>

        <div className={`reviews-stack stagger ${stackVisible ? 'visible' : ''}`} ref={stackRef}>
          {visibleReviews.map((review, index) => (
            <article
              key={review.id}
              className={`review-card review-card-${(index % 4) + 1} ${index % 2 === 0 ? 'card-gold' : 'card-light'}`}
            >
              <div className="review-header">
                <div className="reviewer-info">
                  <div className="reviewer-avatar">{review.name.charAt(0)}</div>
                  <div>
                    <h4 className="reviewer-name">{review.name}</h4>
                    <span className="review-role">{review.role || 'Customer'}</span>
                  </div>
                </div>
                <div className="review-rating-pill">
                  {renderStars(review.rating)}
                </div>
              </div>
              <p className="review-text">{review.text}</p>
            </article>
          ))}
        </div>

        <div className="text-center add-review-wrap">
          <button className="btn btn-primary" type="button" onClick={() => setIsModalOpen(true)}>
            Add Your Review
          </button>
          {hasMoreReviews && (
            <button
              className="btn btn-secondary more-reviews-btn"
              type="button"
              onClick={() => setShowAllReviews((prev) => !prev)}
            >
              {showAllReviews ? 'Show Less Reviews' : 'More Reviews'}
            </button>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="review-modal" onClick={(event) => event.stopPropagation()}>
            <button className="modal-close" type="button" onClick={() => setIsModalOpen(false)} aria-label="Close">
              ×
            </button>

            <form className="review-form" onSubmit={handleSubmit}>
              <h3>Add Your Review</h3>

              <label htmlFor="review-name">Your Name</label>
              <input
                id="review-name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter your name"
                required
              />

              <label htmlFor="review-text">Your Review</label>
              <textarea
                id="review-text"
                name="text"
                rows="4"
                value={formData.text}
                onChange={handleInputChange}
                placeholder="Tell us about your experience..."
                required
              />

              <label>Your Rating</label>
              <div className="rating-picker">{renderRatingPicker()}</div>

              <button type="submit" className="btn btn-primary submit-review-btn">
                Submit Review
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default Reviews;
