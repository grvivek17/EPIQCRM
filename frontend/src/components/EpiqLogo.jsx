import React from 'react';

export default function EpiqLogo({ size = 36, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className={className} style={{ borderRadius: '8px' }}>
      <rect width="100" height="100" fill="#ffffff" />
      {/* Dark blue border frame */}
      <rect x="22" y="22" width="40" height="7" fill="#1b2e4b" />
      <rect x="22" y="22" width="7" height="56" fill="#1b2e4b" />
      <rect x="22" y="71" width="56" height="7" fill="#1b2e4b" />
      <rect x="71" y="44" width="7" height="34" fill="#1b2e4b" />
      
      {/* Orange corner square */}
      <rect x="70" y="20" width="10" height="10" fill="#e87c31" />
      
      {/* Dark blue 'E' */}
      <rect x="40" y="35" width="7" height="29" fill="#1b2e4b" />
      <rect x="40" y="35" width="21" height="7" fill="#1b2e4b" />
      <rect x="40" y="46" width="16" height="7" fill="#1b2e4b" />
      <rect x="40" y="57" width="23" height="7" fill="#1b2e4b" />
    </svg>
  );
}
