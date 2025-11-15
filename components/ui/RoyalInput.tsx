import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface RoyalInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
  error?: string;
  touched?: boolean;
}

const RoyalInput: React.FC<RoyalInputProps> = ({ label, icon, error, touched, type, ...props }) => {
  const id = React.useId();
  const hasError = touched && error;
  const isPassword = type === 'password';
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(prev => !prev);
  };

  const currentType = isPassword ? (isPasswordVisible ? 'text' : 'password') : type;

  return (
    <div className="relative h-24">
      <label htmlFor={id} className="block text-sm font-medium text-amber-400 mb-2 font-cinzel">
        {label}
      </label>
      <div className="relative">
        {icon && <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">{icon}</div>}
        <input
          id={id}
          type={currentType}
          className={`w-full bg-black/40 border-2 ${hasError ? 'border-red-500' : 'border-amber-500/50'} rounded-lg py-2.5 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 ${hasError ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-yellow-400 focus:border-yellow-400'} focus:shadow-[0_0_15px_rgba(251,191,36,0.5)] transition-all duration-300 ${icon ? 'pl-10' : ''} ${isPassword ? 'pr-10' : ''}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
            aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
          >
            {isPasswordVisible ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}
      </div>
      {hasError && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};

export default RoyalInput;