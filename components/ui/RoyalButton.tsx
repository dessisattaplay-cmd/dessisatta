import React from 'react';

interface RoyalButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
}

const RoyalButton: React.FC<RoyalButtonProps> = ({ children, className = '', ...props }) => {
  return (
    <button
      className={`font-cinzel font-bold text-black px-8 py-3 rounded-lg bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 hover:from-yellow-500 hover:to-amber-500 transition-all duration-300 ease-in-out transform hover:scale-105 shadow-[0_0_15px_rgba(251,191,36,0.6)] hover:shadow-[0_0_30px_rgba(251,191,36,0.8)] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-[0_0_15px_rgba(251,191,36,0.4)] ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default RoyalButton;