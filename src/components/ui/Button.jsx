import React from 'react';

const variants = {
  primary: 'bg-navy-500 text-white hover:bg-navy-600',
  secondary: 'bg-navy-50 text-navy-600 hover:bg-navy-100',
  danger: 'bg-red-50 text-red-600 hover:bg-red-100',
};

const Button = ({ children, variant = 'primary', className = '', ...props }) => (
  <button
    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    {...props}
  >
    {children}
  </button>
);

export default Button;
