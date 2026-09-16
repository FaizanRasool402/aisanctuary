import React, { useState } from 'react';

const PasswordInput = ({
  label,
  value,
  onChange,
  required,
  placeholder,
  minLength,
  id,
  name,
  autoComplete,
  className = '',
}) => {
  const [show, setShow] = useState(false);

  return (
    <div className={className}>
      {label && (
        <label className="mb-1 block text-sm font-medium text-navy-900">{label}</label>
      )}
      <div className="relative">
        <input
          id={id}
          name={name}
          type={show ? 'text' : 'password'}
          value={value}
          required={required}
          minLength={minLength}
          autoComplete={autoComplete}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-navy-100 px-3 py-2 pr-10 text-sm focus:border-navy-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-navy-600"
          aria-label={show ? 'Hide password' : 'Show password'}
          tabIndex={-1}
        >
          {show ? (
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.6 10.6A2 2 0 0012 14a2 2 0 001.4-.6" />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.9 5.1A10.5 10.5 0 0112 5c7 0 10 7 10 7a18.5 18.5 0 01-4.2 4.8M6.1 6.1C3.6 7.8 2 12 2 12s3 7 10 7c1.7 0 3.2-.4 4.5-1.1"
              />
            </svg>
          ) : (
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

export default PasswordInput;
