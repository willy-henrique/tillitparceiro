import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'light' | 'admin';
  className?: string;
}

const px = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-12 h-12' };

/** Logo Tillit — marca oficial */
const Logo: React.FC<LogoProps> = ({ size = 'md', variant = 'default', className = '' }) => {
  const isDefault = variant === 'default';
  const rounded = isDefault ? '' : 'rounded-xl';
  const shadow = isDefault ? '' : 'shadow-lg';

  return (
    <div
      className={`${px[size]} flex items-center justify-center flex-shrink-0 overflow-hidden ${rounded} ${shadow} ${className}`}
    >
      <img
        src="/logotillit.png"
        alt="Tillit"
        className="w-full h-full object-contain"
      />
    </div>
  );
};

export default Logo;
