const Logo = ({ className = '' }) => {
  return (
    <div className={`brand-logo ${className}`.trim()} style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent-gold)' }}>
      <span style={{ fontFamily: 'var(--font-heading)', fontSize: '2.4rem', letterSpacing: '1px', fontWeight: '500', lineHeight: 1 }}>
        JOR
      </span>
      
      <svg width="40" height="50" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, marginTop: '-6px' }}>
        <path d="M16 2 L16 8 M10 4 L12 8 M22 4 L20 8 M6 6 L8 8 M26 6 L24 8 M8 10 L24 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 14 L28 14 L28 24 C28 32 16 38 16 38 C16 38 4 32 4 24 Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M4 21 L28 21 M16 14 L16 38" stroke="currentColor" strokeWidth="2.5" />
      </svg>

      <span style={{ fontFamily: 'var(--font-heading)', fontSize: '2.4rem', letterSpacing: '1px', fontWeight: '500', lineHeight: 1 }}>
        SHOR
      </span>
    </div>
  );
};

export default Logo;
