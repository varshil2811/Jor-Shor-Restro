const Logo = ({ className = '' }) => {
  return (
    <img
      src="/images/final logo.png"
      alt="Jor Shor Logo"
      className={`brand-logo ${className}`.trim()}
      style={{ objectFit: 'contain' }}
    />
  );
};

export default Logo;
