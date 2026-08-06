import { useState, useEffect } from 'react';
import { Menu, X, PhoneCall } from 'lucide-react';
import Logo from './Logo';
import './Header.css';

const Header = () => {
  const [isScrolled, setIsScrolled]       = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSection, setActiveSection]   = useState('home');

  useEffect(() => {
    const handleScroll = () => {
      const scrollY   = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setIsScrolled(scrollY > 20);
      setScrollProgress(docHeight > 0 ? (scrollY / docHeight) * 100 : 0);

      // highlight active nav link
      const sections = ['home','menu','gallery','about','reviews','contact'];
      for (const id of [...sections].reverse()) {
        const el = document.getElementById(id);
        if (el && scrollY >= el.offsetTop - 120) {
          setActiveSection(id);
          break;
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home',    href: '#home' },
    { name: 'Menu',    href: '#menu' },
    { name: 'Gallery', href: '#gallery' },
    { name: 'About',   href: '#about' },
    { name: 'Reviews', href: '#reviews' },
    { name: 'Contact', href: '#contact' }
  ];

  return (
    <header className={`header ${isScrolled ? 'scrolled' : ''}`}>
      {/* scroll progress bar */}
      <div className="scroll-progress" style={{ width: `${scrollProgress}%` }} />

      <div className="container header-content">
        <a href="#home" className="logo" aria-label="Jor Shor Restro">
          <Logo />
        </a>

        <nav className="desktop-nav">
          <ul>
            {navLinks.map(link => (
              <li key={link.name}>
                <a
                  href={link.href}
                  className={activeSection === link.href.slice(1) ? 'nav-active' : ''}
                >
                  {link.name}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="header-actions">
          <a href="#contact" className="btn btn-primary cta-btn">
            <PhoneCall size={18} style={{ marginRight: '8px' }} />
            Reserve a Table
          </a>

          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      <div className={`mobile-nav ${mobileMenuOpen ? 'open' : ''}`}>
        <ul>
          {navLinks.map(link => (
            <li key={link.name}>
              <a
                href={link.href}
                className={activeSection === link.href.slice(1) ? 'nav-active' : ''}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.name}
              </a>
            </li>
          ))}
        </ul>
        <div className="mobile-cta-wrapper">
          <a href="#contact" className="btn btn-primary w-full text-center" onClick={() => setMobileMenuOpen(false)}>
            Reserve a Table
          </a>
        </div>
      </div>
    </header>
  );
};

export default Header;
