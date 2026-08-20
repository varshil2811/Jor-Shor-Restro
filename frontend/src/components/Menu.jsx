import { useState, useEffect } from 'react';
import './Menu.css';
import { Leaf, Flame, ArrowDownToLine, Loader, X, ChevronRight } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useInView } from '../hooks/useInView';
import { optimizeCloudinaryUrl, generateSrcSet } from '../utils/cloudinary';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';
const DESC_MAX_LENGTH = 70;

const Menu = () => {
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [menuData, setMenuData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [customPdfUrl, setCustomPdfUrl] = useState(null);
  const [visibleCount, setVisibleCount] = useState(4);
  const [headerRef, headerVisible] = useInView();
  const [gridRef, gridVisible] = useInView();

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await fetch(`${API_URL}/menu`);
        const data = await res.json();
        setMenuData(data);
        if (data.length > 0 && activeCategory === 'Starters') {
          setActiveCategory('ALL');
        }
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch menu:', err);
        setLoading(false);
      }
    };

    const fetchMenuPdf = async () => {
      try {
        const res = await fetch(`${API_URL}/settings/menu_pdf`);
        if (res.ok) {
          const data = await res.json();
          setCustomPdfUrl(data.value);
        }
      } catch (err) {
        // silently fail if setting not found
      }
    };

    fetchMenu();
    fetchMenuPdf();
  }, []);

  const handleCategorySwitch = (newCategory) => {
    if (newCategory === activeCategory) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveCategory(newCategory);
      setVisibleCount(4);
      setIsTransitioning(false);
    }, 300);
  };

  const currentCategoryData = activeCategory === 'ALL'
    ? { category: 'ALL', items: menuData.flatMap(c => c.items) }
    : menuData.find(c => c.category === activeCategory);

  const displayedItemsCount = currentCategoryData?.items ? Math.min(currentCategoryData.items.length, visibleCount) : 0;
  const isFewItems = displayedItemsCount > 0 && displayedItemsCount < 4;

  const downloadPDF = async () => {
    if (customPdfUrl) {
      // Force Cloudinary to trigger a direct file download by injecting fl_attachment
      try {
        let downloadUrl = customPdfUrl;
        if (downloadUrl.includes('cloudinary.com') && !downloadUrl.includes('fl_attachment')) {
          // Inject fl_attachment after /upload/
          downloadUrl = downloadUrl.replace('/upload/', '/upload/fl_attachment/');
        }

        // Open the modified URL which Cloudinary will serve as an attachment download
        window.location.href = downloadUrl;
      } catch (err) {
        console.error('Failed to parse Cloudinary URL for download:', err);
        window.open(customPdfUrl, '_blank'); // fallback
      }
      return;
    }

    if (menuData.length === 0) return;
    setPdfLoading(true);

    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();

      // ── Header ──────────────────────────────────────────────
      doc.setFillColor(26, 19, 14); // dark bg
      doc.rect(0, 0, pageWidth, 42, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(28);
      doc.setTextColor(52, 69, 58); // gold
      doc.text('JOR SHOR RESTRO', pageWidth / 2, 20, { align: 'center' });

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(200, 185, 155);
      doc.text('Full Menu', pageWidth / 2, 30, { align: 'center' });

      doc.setFontSize(9);
      doc.setTextColor(160, 145, 120);
      doc.text(`Generated on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`, pageWidth / 2, 38, { align: 'center' });

      let yOffset = 52;

      for (const category of menuData) {
        if (category.items.length === 0) continue;

        // Check if we need a new page for the category header
        if (yOffset > 260) {
          doc.addPage();
          yOffset = 20;
        }

        // ── Category heading ─────────────────────────────────
        doc.setFillColor(40, 30, 20);
        doc.roundedRect(14, yOffset - 5, pageWidth - 28, 12, 3, 3, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(52, 69, 58);
        doc.text(category.category, 20, yOffset + 3);
        yOffset += 14;

        // ── Items table ──────────────────────────────────────
        const rows = category.items.map(item => [
          item.name,
          item.type === 'veg' ? 'Veg' : 'Non-Veg',
          item.spice > 0 ? '🌶'.repeat(item.spice) : '—',
          item.desc || '—',
          `Rs. ${String(item.price).replace(/[^0-9.]/g, '')}`
        ]);

        autoTable(doc, {
          startY: yOffset,
          head: [['Item', 'Type', 'Spice', 'Description', 'Price']],
          body: rows,
          theme: 'grid',
          styles: {
            fontSize: 9,
            cellPadding: 3,
            textColor: [40, 30, 20],
            lineColor: [52, 69, 58],
            lineWidth: 0.2,
          },
          headStyles: {
            fillColor: [52, 69, 58],
            textColor: [26, 19, 14],
            fontStyle: 'bold',
            fontSize: 9,
          },
          alternateRowStyles: {
            fillColor: [250, 246, 235],
          },
          columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 38 },
            1: { cellWidth: 20, halign: 'center' },
            2: { cellWidth: 18, halign: 'center' },
            3: { cellWidth: 'auto' },
            4: { cellWidth: 24, halign: 'right', fontStyle: 'bold' },
          },
          margin: { left: 14, right: 14 },
        });

        yOffset = doc.lastAutoTable.finalY + 10;
      }

      // ── Footer on last page ──────────────────────────────
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(160, 145, 120);
        doc.text(`Page ${i} of ${totalPages}  •  Jor Shor Restro`, pageWidth / 2, 290, { align: 'center' });
      }

      doc.save('Jor-Shor-Menu.pdf');
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setPdfLoading(false);
    }
  };

  useEffect(() => {
    if (selectedItem) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedItem(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedItem]);

  return (
    <section id="menu" className="section menu-section">
      <div className="container">
        <div className={`text-center reveal ${headerVisible ? 'visible' : ''}`} ref={headerRef}>
          <h2 className="section-title">Our Menu</h2>
          <p className="menu-subtitle">Discover our culinary delights</p>
          <div className="download-btn-wrapper" style={{ margin: '0 auto 1rem', width: '100%', padding: '0 1rem', boxSizing: 'border-box' }}>
            <button className="btn btn-secondary" onClick={downloadPDF} disabled={pdfLoading || loading} style={{ whiteSpace: 'normal', height: 'auto', padding: '0.8rem 1rem', width: '100%', maxWidth: '350px' }}>
              {pdfLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <Loader size={18} className="animate-spin" />
                  <span>Generating PDF...</span>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <ArrowDownToLine size={18} />
                  <span>Download Full Menu</span>
                </div>
              )}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <Loader className="animate-spin" size={32} color="#b4a081" />
            <p className="mt-2">Loading menu...</p>
          </div>
        ) : (
          <>
            <div className="menu-tabs menu-tabs-enter">
              <button
                className={`menu-tab-btn ${activeCategory === 'ALL' ? 'active' : ''}`}
                onClick={() => handleCategorySwitch('ALL')}
              >
                ALL
              </button>
              {menuData.map((cat) => (
                <button
                  key={cat.category}
                  className={`menu-tab-btn ${activeCategory === cat.category ? 'active' : ''}`}
                  onClick={() => handleCategorySwitch(cat.category)}
                >
                  {cat.category}
                </button>
              ))}
            </div>

            <div className={`menu-transition-wrapper ${isTransitioning ? 'fade-out' : 'fade-in'}`}>
              <div key={activeCategory} className={`menu-grid stagger ${gridVisible && !isTransitioning ? 'visible' : ''} ${isFewItems ? 'menu-grid-few' : ''}`} ref={gridRef}>
                {currentCategoryData?.items
                  .slice(0, visibleCount)
                  .map((item, index) => {
                    return (
                      <div key={item._id || item.id} className="menu-item-card" onClick={() => setSelectedItem(item)}>
                        {/* Image Section - Top */}
                        <div className="menu-item-image-wrapper skeleton-bg">
                          {item.imageUrl ? (
                            <img
                              src={optimizeCloudinaryUrl(item.imageUrl, { width: 400 })}
                              srcSet={generateSrcSet(item.imageUrl, [200, 400, 800])}
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              alt={item.name}
                              className="menu-item-image img-fade"
                              loading={index < 4 ? "eager" : "lazy"}
                              fetchPriority={index < 4 ? "high" : "auto"}
                              onLoad={e => e.currentTarget.classList.add('loaded')}
                            />
                          ) : (
                            <div className="menu-item-image-placeholder">
                              <span className="placeholder-text">Jor Shor</span>
                            </div>
                          )}
                          <div className="menu-item-price-badge">
                            ₹{String(item.price).replace(/[^0-9.]/g, '')}
                          </div>

                          <div className="menu-item-hover-overlay">
                            <span>View Details</span>
                          </div>
                        </div>

                        {/* Content Section - Bottom */}
                        <div className="menu-item-content">
                          <h3 className="menu-item-name">{item.name}</h3>

                          {(item.type || item.spice > 0 || item.servingSize) && (
                            <div className="menu-item-tags">
                              {item.type === 'veg' && (
                                <span className="tag-pill tag-veg" title="Vegetarian"><div className="dot"></div>Veg</span>
                              )}
                              {item.type === 'non-veg' && (
                                <span className="tag-pill tag-non-veg" title="Non-Vegetarian"><div className="dot"></div>Non-Veg</span>
                              )}
                              {item.spice > 0 && (
                                <span className="tag-pill tag-spice">
                                  {[...Array(item.spice)].map((_, i) => (
                                    <Flame key={i} size={11} color="#b4a081" style={{ marginRight: '1px' }} />
                                  ))}
                                  Spicy
                                </span>
                              )}
                              {item.servingSize && (
                                <span className="tag-pill tag-serve">{item.servingSize}</span>
                              )}
                            </div>
                          )}

                          <div className="menu-item-mobile-hint">
                            Tap for details <ChevronRight size={14} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {currentCategoryData?.items && currentCategoryData.items.length === 0 && (
                <div className="text-center" style={{ color: '#666', marginTop: '2rem' }}>
                  <p>No items added to this category yet.</p>
                </div>
              )}

              {currentCategoryData?.items && currentCategoryData.items.length > visibleCount && (
                <div className="text-center" style={{ marginTop: '2.5rem' }}>
                  <button
                    className="btn btn-primary"
                    style={{ padding: '0.6rem 2rem' }}
                    onClick={() => setVisibleCount(prev => prev + 4)}
                  >
                    More Items
                  </button>
                </div>
              )}
            </div>
          </>
        )}

      </div>

      {/* Modal */}
      {selectedItem && (
        <div className="menu-modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="menu-modal-content" onClick={e => e.stopPropagation()}>
            <button className="menu-modal-close" onClick={() => setSelectedItem(null)}>
              <X size={24} />
            </button>
            <div className="menu-modal-image-wrapper skeleton-bg">
              {selectedItem.imageUrl ? (
                <img src={optimizeCloudinaryUrl(selectedItem.imageUrl, { width: 800 })} srcSet={generateSrcSet(selectedItem.imageUrl, [400, 800, 1200])} sizes="(max-width: 768px) 100vw, 800px" alt={selectedItem.name} className="menu-modal-image img-fade" loading="lazy" onLoad={e => e.currentTarget.classList.add('loaded')} />
              ) : (
                <div className="menu-item-image-placeholder">
                  <span className="placeholder-text">Jor Shor</span>
                </div>
              )}
            </div>
            <div className="menu-modal-body">
              <div className="menu-modal-header">
                <h3 className="menu-modal-name">{selectedItem.name}</h3>

                {(selectedItem.type || selectedItem.spice > 0 || selectedItem.servingSize) && (
                  <div className="menu-item-tags" style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
                    {selectedItem.type === 'veg' && (
                      <span className="tag-pill tag-veg" title="Vegetarian"><div className="dot"></div>Veg</span>
                    )}
                    {selectedItem.type === 'non-veg' && (
                      <span className="tag-pill tag-non-veg" title="Non-Vegetarian"><div className="dot"></div>Non-Veg</span>
                    )}
                    {selectedItem.spice > 0 && (
                      <span className="tag-pill tag-spice">
                        {[...Array(selectedItem.spice)].map((_, i) => (
                          <Flame key={i} size={13} color="#b4a081" style={{ marginRight: '2px' }} />
                        ))}
                        Spicy
                      </span>
                    )}
                    {selectedItem.servingSize && (
                      <span className="tag-pill tag-serve">{selectedItem.servingSize}</span>
                    )}
                  </div>
                )}
              </div>

              {selectedItem.desc && (
                <div className="menu-modal-desc-container">
                  <p className="menu-modal-desc">{selectedItem.desc}</p>
                </div>
              )}

              <div className="menu-modal-footer">
                <div className="menu-modal-price-badge">
                  <span className="price-currency">₹</span>
                  <span className="price-amount">{String(selectedItem.price).replace(/[^0-9.]/g, '')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Menu;
