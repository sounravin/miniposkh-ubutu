import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  showText?: boolean;
  variant?: 'badge' | 'compact';
}

export const LogoVector: React.FC<{ size?: number; className?: string }> = ({ size = 44, className = '' }) => (
  <svg 
    viewBox="0 0 512 512" 
    width={size} 
    height={size} 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
  >
    {/* Outer Blue Circular Border */}
    <circle cx="256" cy="256" r="236" stroke="#0084b4" strokeWidth="26" fill="#ffffff" />

    {/* Base Concentric Radar Rings */}
    <ellipse cx="256" cy="335" rx="115" ry="24" stroke="#0088b4" strokeWidth="9" fill="none" />
    <ellipse cx="256" cy="335" rx="80" ry="16" stroke="#0088b4" strokeWidth="8" fill="none" />

    {/* 3 Ascending Growth Arrows */}
    <g stroke="#22c55e" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round">
      <path d="M260 148 L286 118" />
      <path d="M268 116 L286 118 L284 136" />
    </g>
    <g stroke="#10b981" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round">
      <path d="M290 134 L318 102" />
      <path d="M300 100 L318 102 L316 120" />
    </g>
    <g stroke="#f97316" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round">
      <path d="M320 116 L354 80" />
      <path d="M334 78 L354 80 L352 98" />
    </g>

    {/* POS Terminal Body */}
    <path 
      d="M220 156 L318 156 C332 156 340 168 335 182 L302 298 C298 310 286 320 272 320 L200 320 C186 320 176 308 180 294 L212 172 C214 162 217 156 220 156 Z" 
      fill="#0284c7" 
    />
    <path d="M302 208 L340 232 L322 284 L294 274 Z" fill="#0369a1" />

    {/* Screen Bezel & Glass */}
    <path d="M230 170 L308 170 L286 248 L208 248 Z" fill="#e0f2fe" />
    <path d="M276 174 L300 174 L258 244 L234 244 Z" fill="white" opacity="0.65" />

    {/* Keypad Buttons on POS */}
    <rect x="210" y="262" width="24" height="13" rx="3" fill="white" />
    <rect x="242" y="262" width="24" height="13" rx="3" fill="white" />
    <rect x="216" y="284" width="46" height="12" rx="3" fill="white" />

    {/* Shopping Cart */}
    <g transform="translate(42, 18)">
      <path 
        d="M104 172 L128 172 L148 226 L210 226 L224 182 L138 182" 
        stroke="#f59e0b" 
        strokeWidth="16" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        fill="#f59e0b" 
      />
      <path d="M102 172 L120 172" stroke="#ea580c" strokeWidth="14" strokeLinecap="round" />
      <circle cx="156" cy="248" r="12" fill="#ea580c" />
      <circle cx="198" cy="248" r="12" fill="#ea580c" />
    </g>

    {/* Brand Typography: MINI MART POS */}
    <text 
      x="256" 
      y="392" 
      textAnchor="middle" 
      fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" 
      fontWeight="900" 
      fontSize="44" 
      letterSpacing="2" 
      fill="#08426b"
    >
      MINI MART
    </text>
    <text 
      x="256" 
      y="442" 
      textAnchor="middle" 
      fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" 
      fontWeight="900" 
      fontSize="46" 
      letterSpacing="4" 
      fill="#08426b"
    >
      POS
    </text>
  </svg>
);

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
  variant = 'badge'
}) => {
  // Determine dimensions based on size
  let pixelSize = 44;
  if (typeof size === 'number') {
    pixelSize = size;
  } else {
    switch (size) {
      case 'sm':
        pixelSize = 32;
        break;
      case 'md':
        pixelSize = 44;
        break;
      case 'lg':
        pixelSize = 64;
        break;
      case 'xl':
        pixelSize = 120;
        break;
    }
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2.5 ${className}`}>
        <div 
          style={{ width: pixelSize, height: pixelSize }} 
          className="relative shrink-0 rounded-full bg-white shadow-xs flex items-center justify-center border-2 border-[#0084b4] overflow-hidden"
        >
          <LogoVector size={pixelSize} />
        </div>

        {showText && (
          <div>
            <div className="font-extrabold text-base tracking-tight text-[#08426b] flex items-center gap-1.5 leading-tight">
              <span>MINI MART POS</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
            </div>
            <p className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">Point of Sale System</p>
          </div>
        )}
      </div>
    );
  }

  // Full Badge View (Matches user's exact circular logo artwork)
  return (
    <div 
      style={{ width: pixelSize, height: pixelSize }}
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}
    >
      <LogoVector size={pixelSize} />
    </div>
  );
};
