import { useState, useEffect } from 'react';
import './Menu.css';
import { Leaf, Flame, ArrowDownToLine, Loader, X } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useInView } from '../hooks/useInView';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const DESC_MAX_LENGTH = 70;

const Menu = () => {
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [menuData, setMenuData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [customPdfUrl, setCustomPdfUrl] = useState(null);
  const [showAllItems, setShowAllItems] = useState(false);
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
      setShowAllItems(false);
      setIsTransitioning(false);
    }, 300);
  };

  const currentCategoryData = activeCategory === 'ALL'
    ? { category: 'ALL', items: menuData.flatMap(c => c.items) }
    : menuData.find(c => c.category === activeCategory);

  const displayedItemsCount = currentCategoryData?.items
    ? (showAllItems ? currentCategoryData.items.length : Math.min(currentCategoryData.items.length, 3))
    : 0;
  const isFewItems = displayedItemsCount > 0 && displayedItemsCount < 3;

  const downloadPDF = async () => {
    if (customPdfUrl) {
      // If a custom PDF is uploaded, download it directly
      window.open(customPdfUrl, '_blank');
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
    return () => { document.body.style.overflow = 'auto'; };
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
                  <span>Download Full PDF Menu</span>
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
                  .slice(0, showAllItems ? currentCategoryData.items.length : 3)
                  .map((item) => {
                    const shouldTruncate = item.desc && item.desc.length > DESC_MAX_LENGTH;
                    const displayDesc = shouldTruncate
                      ? item.desc.substring(0, DESC_MAX_LENGTH) + '...'
                      : item.desc;

                    return (
                      <div key={item._id} className="menu-item-card">
                        {/* Image Section - Top */}
                        <div className="menu-item-image-wrapper">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="menu-item-image img-fade"
                              onLoad={e => e.currentTarget.classList.add('loaded')}
                            />
                          ) : (
                            <div className="menu-item-image-placeholder">
                              <span className="placeholder-text">Jor Shor</span>
                            </div>
                          )}
                        </div>

                        {/* Content Section - Bottom */}
                        <div className="menu-item-content">
                          <div className="menu-item-header">
                            <h3 className="menu-item-name">
                              <span className="name-text">{item.name}</span>
                            </h3>
                          </div>

                          <div className="menu-item-tags">
                            {item.type === 'veg' ? (
                              <span className="tag-pill tag-veg" title="Vegetarian"><div className="dot"></div>Veg</span>
                            ) : (
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
                          </div>

                          <p className="menu-item-desc">
                            {displayDesc}
                            {shouldTruncate && (
                              <button className="btn-read-more" onClick={() => setSelectedItem(item)}>
                                show more
                              </button>
                            )}
                          </p>

                          <div className="menu-item-footer">
                            <div className="menu-item-price-modern">
                              <span className="price-currency">₹</span>
                              <span className="price-amount">{String(item.price).replace(/[^0-9.]/g, '')}</span>
                            </div>
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

              {currentCategoryData?.items && currentCategoryData.items.length > 3 && (
                <div className="text-center" style={{ marginTop: '2.5rem' }}>
                  <button
                    className="btn btn-primary"
                    style={{ padding: '0.6rem 2rem' }}
                    onClick={() => setShowAllItems(!showAllItems)}
                  >
                    {showAllItems ? 'View Less' : 'View More Items'}
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
            <div className="menu-modal-image-wrapper">
              {selectedItem.imageUrl ? (
                <img src={selectedItem.imageUrl} alt={selectedItem.name} className="menu-modal-image" />
              ) : (
                <div className="menu-item-image-placeholder">
                  <span className="placeholder-text">Jor Shor</span>
                </div>
              )}
            </div>
            <div className="menu-modal-body">
              <div className="menu-modal-header">
                <h3 className="menu-modal-name">
                  <span className="name-text">{selectedItem.name}</span>
                  {selectedItem.type === 'veg' ? (
                    <span className="type-icon veg" title="Vegetarian"><div className="dot"></div></span>
                  ) : (
                    <span className="type-icon non-veg" title="Non-Vegetarian"><div className="dot"></div></span>
                  )}
                </h3>
                {selectedItem.spice > 0 && (
                  <div className="menu-modal-spice">
                    {[...Array(selectedItem.spice)].map((_, i) => (
                      <Flame key={i} size={18} color="#ff4500" />
                    ))}
                  </div>
                )}
              </div>
              <div className="menu-modal-desc-container">
                <p className="menu-modal-desc">{selectedItem.desc}</p>
              </div>
              <div className="menu-modal-footer">
                <div className="price-pill modal-price">
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
