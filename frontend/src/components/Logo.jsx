const Logo = ({ className = '' }) => {
  return (
    <svg
      className={`brand-logo ${className}`.trim()}
      viewBox="0 0 647 172"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Jor Shor Restro"
    >
      <title>Jor Shor Restro</title>
      <image
        href="/images/jor-shor-logo.png"
        x="0"
        y="0"
        width="647"
        height="172"
        preserveAspectRatio="xMidYMid meet"
      />
    </svg>
  );
};

export default Logo;
