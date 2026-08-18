import { useState, useEffect } from 'react';
import './Gallery.css';
import { X, ChevronLeft, ChevronRight, Loader, Play } from 'lucide-react';
import { useInView } from '../hooks/useInView';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';

const Gallery = () => {
  const [galleryImages, setGalleryImages] = useState([]);
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('photos'); // 'photos' or 'videos'
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [headerRef, headerVisible] = useInView();
  const [gridRef, gridVisible] = useInView();

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const [galleryRes, reelsRes] = await Promise.all([
          fetch(`${API_URL}/gallery`),
          fetch(`${API_URL}/reels`)
        ]);
        const galleryData = await galleryRes.json();
        const reelsData = await reelsRes.json();
        setGalleryImages(galleryData);
        setReels(reelsData);
      } catch (err) {
        console.error('Failed to fetch gallery:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchGallery();
  }, []);

  const openLightbox = (index) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    document.body.style.overflow = 'auto';
  };

  const nextImage = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const prevImage = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  // Logic for display limit
  const maxImages = 6;
  const hasMore = galleryImages.length > maxImages;
  const displayImages = showAll ? galleryImages : galleryImages.slice(0, maxImages);

  return (
    <section id="gallery" className="section gallery-section">
      <div className="container">
        <div className={`text-center reveal ${headerVisible ? 'visible' : ''}`} ref={headerRef}>
          <h2 className="section-title">Gallery</h2>
          <p className="menu-subtitle">A glimpse of our world</p>

          <div className="gallery-toggle">
            <button
              className={`toggle-btn ${activeView === 'photos' ? 'active' : ''}`}
              onClick={() => setActiveView('photos')}
            >
              Photos
            </button>
            <button
              className={`toggle-btn ${activeView === 'videos' ? 'active' : ''}`}
              onClick={() => setActiveView('videos')}
            >
              Videos
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <Loader className="animate-spin" size={32} color="#b4a081" />
            <p className="mt-2">Loading gallery...</p>
          </div>
        ) : (
          <>
            {activeView === 'videos' && (
              <div className="reels-section">
                {reels.length === 0 ? (
                  <div className="text-center py-5" style={{ color: '#666' }}>
                    <p>No videos in gallery yet.</p>
                  </div>
                ) : (
                  <div className="reels-scroll-container">
                    {reels.map(reel => (
                      <div key={reel.id} className="reel-card">
                        <video
                          src={reel.url}
                          className="reel-video"
                          controls
                          muted
                          loop
                          playsInline
                          preload="metadata"
                        />
                        {reel.title && <div className="reel-caption">{reel.title}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeView === 'photos' && (
              <>
                {galleryImages.length === 0 ? (
                  <div className="text-center py-5" style={{ color: '#666' }}>
                    <p>No images in gallery yet.</p>
                  </div>
                ) : (
                  <div className={`gallery-grid stagger ${gridVisible ? 'visible' : ''}`} ref={gridRef}>
                    {displayImages.map((img, index) => {
                      const isLastAndMore = !showAll && index === maxImages - 1 && hasMore;
                      const remainingCount = galleryImages.length - maxImages;

                      return (
                        <div
                          key={img.id}
                          className="gallery-item"
                          onClick={() => isLastAndMore ? setShowAll(true) : openLightbox(index)}
                        >
                          <img
                            src={img.url}
                            alt="Gallery"
                            className="img-fade"
                            onLoad={e => e.currentTarget.classList.add('loaded')}
                          />

                          {isLastAndMore ? (
                            <div className="gallery-more-overlay">
                              <span className="more-count">+{remainingCount}</span>
                              <span className="more-label">View More</span>
                            </div>
                          ) : (
                            <div className="gallery-overlay">
                              <span>View</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {lightboxOpen && (
        <div className="lightbox" onClick={closeLightbox}>
          <button className="lightbox-close" onClick={closeLightbox}>
            <X size={32} />
          </button>

          <button className="lightbox-nav prev" onClick={prevImage}>
            <ChevronLeft size={48} />
          </button>

          <img
            src={galleryImages[currentIndex].url}
            alt="Gallery"
            className="lightbox-img"
            onClick={(e) => e.stopPropagation()}
          />

          <button className="lightbox-nav next" onClick={nextImage}>
            <ChevronRight size={48} />
          </button>

          <div className="lightbox-caption">
            {currentIndex + 1} / {galleryImages.length}
          </div>
        </div>
      )}
    </section>
  );
};

export default Gallery;
