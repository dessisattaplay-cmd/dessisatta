import React from 'react';

const CrownIcon: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        stroke="currentColor" 
        strokeWidth="1" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        className={className}
    >
      <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" />
    </svg>
  );
};

export default CrownIcon;