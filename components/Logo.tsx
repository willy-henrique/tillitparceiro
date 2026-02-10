import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'light' | 'admin';
  className?: string;
}

const px = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-12 h-12' };
const svgSize = { sm: 20, md: 26, lg: 30 };

/** Logo "T" Tillit — azul profissional */
const Logo: React.FC<LogoProps> = ({ size = 'md', variant = 'default', className = '' }) => {
  const isAdmin = variant === 'admin';
  const isLight = variant !== 'default';
  const fill = isLight ? '#ffffff' : '#003366';
  const bg = isLight ? (isAdmin ? '#00B050' : '#003366') : 'transparent';

  const svg = (
    <svg
      width={svgSize[size]}
      height={svgSize[size]}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="tillitBlue" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0066CC" />
          <stop offset="100%" stopColor="#003366" />
        </linearGradient>
      </defs>
      <path
        d="M4 4h24v5H4V4zm4 9v15h4V13h8v15h4V13h4V9H4v4h4z"
        fill={isLight ? fill : 'url(#tillitBlue)'}
        fillRule="evenodd"
      />
    </svg>
  );

  if (variant === 'default') {
    return (
      <div className={`${px[size]} flex items-center justify-center ${className}`}>{svg}</div>
    );
  }

  return (
    <div
      className={`${px[size]} rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg ${className}`}
      style={{ backgroundColor: bg }}
    >
      {svg}
    </div>
  );
};

export default Logo;
