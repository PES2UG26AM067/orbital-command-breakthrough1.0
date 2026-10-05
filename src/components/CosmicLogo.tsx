import React, { useState } from 'react';

// Exact generated image asset path
import logoAsset from '../assets/images/cosmic_grid_logo_1790404841350.jpg';

interface CosmicLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  subtitle?: string;
  className?: string;
}

export const CosmicLogo: React.FC<CosmicLogoProps> = ({
  size = 'md',
  showText = true,
  subtitle,
  className = '',
}) => {
  const [imageError, setImageError] = useState(false);

  // Dimension presets
  const sizeMap = {
    sm: { img: 'w-7 h-7', container: 'gap-2', title: 'text-sm tracking-wider', sub: 'text-[9px]' },
    md: { img: 'w-8 h-8', container: 'gap-2.5', title: 'text-base font-bold tracking-wider', sub: 'text-[10px]' },
    lg: { img: 'w-12 h-12', container: 'gap-3', title: 'text-2xl font-bold tracking-tight', sub: 'text-xs' },
    xl: { img: 'w-16 h-16', container: 'gap-4', title: 'text-3xl font-extrabold tracking-tight', sub: 'text-sm' },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`flex items-center select-none ${currentSize.container} ${className}`}>
      {/* Insignia Icon Container with Futuristic Outer Ring */}
      <div className="relative shrink-0 flex items-center justify-center">
        {/* Ambient cyan radar glow */}
        <div className="absolute inset-0 rounded-lg bg-cyan-500/20 blur-sm scale-110 pointer-events-none" />

        {/* Outer border & image badge */}
        <div className={`relative ${currentSize.img} rounded-lg overflow-hidden border border-cyan-500/40 bg-slate-950 shadow-md shadow-cyan-950/50 flex items-center justify-center`}>
          {!imageError ? (
            <img
              src={logoAsset}
              alt="Cosmic Grid Insignia"
              referrerPolicy="no-referrer"
              onError={() => setImageError(true)}
              className="w-full h-full object-cover object-center transform scale-105"
            />
          ) : (
            /* High-fidelity Vector Fallback */
            <svg
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full p-1"
            >
              {/* Concentric radar rings */}
              <circle cx="20" cy="20" r="18" stroke="#0e7490" strokeWidth="1" strokeDasharray="2 3" opacity="0.6" />
              <circle cx="20" cy="20" r="13" stroke="#06b6d4" strokeWidth="1.2" opacity="0.8" />
              <circle cx="20" cy="20" r="7" stroke="#38bdf8" strokeWidth="1.5" />
              <circle cx="20" cy="20" r="2.5" fill="#22d3ee" />

              {/* Inclined orbital trajectory ellipses */}
              <ellipse cx="20" cy="20" rx="17" ry="6.5" transform="rotate(-30 20 20)" stroke="#06b6d4" strokeWidth="1.2" strokeOpacity="0.85" />
              <ellipse cx="20" cy="20" rx="17" ry="6.5" transform="rotate(45 20 20)" stroke="#38bdf8" strokeWidth="1.2" strokeOpacity="0.7" />

              {/* Orbital Nodes */}
              <circle cx="7" cy="13" r="1.8" fill="#f43f5e" />
              <circle cx="32" cy="27" r="1.8" fill="#38bdf8" />
              <circle cx="28" cy="11" r="1.5" fill="#fbbf24" />
            </svg>
          )}

          {/* Active scanning sweep overlay animation */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-cyan-400/10 to-transparent pointer-events-none" />
        </div>

        {/* Live Pulse Indicator dot */}
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#090d16] animate-pulse" />
      </div>

      {/* Brand Typography */}
      {showText && (
        <div className="flex flex-col text-left leading-none">
          <div className="flex items-center gap-1.5">
            <span className={`text-slate-100 uppercase font-sans ${currentSize.title} group-hover:text-cyan-400 transition-colors`}>
              COSMIC <span className="text-cyan-400">GRID</span>
            </span>
          </div>
          {subtitle && (
            <span className={`text-slate-500 font-mono tracking-wider uppercase mt-1 ${currentSize.sub}`}>
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
