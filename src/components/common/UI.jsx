import React from 'react';

export const Card = ({ title, children, className = '' }) => (
  <div className={`bg-white p-6 rounded-lg shadow-md ${className}`}>
    {title && <h3 className="text-xl font-semibold mb-4 text-gray-800">{title}</h3>}
    {children}
  </div>
);

export const Button = ({ onClick, children, className = 'bg-blue-600 hover:bg-blue-700', disabled = false }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-md text-white font-medium transition-colors duration-200 ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    disabled={disabled}
  >
    {children}
  </button>
);

export const Input = ({ type = 'text', placeholder, value, onChange, className = '' }) => (
  <input
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    className={`w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${className}`}
  />
);

export const Select = ({ value, onChange, options, className = '' }) => (
  <select
    value={value}
    onChange={onChange}
    className={`w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${className}`}
  >
    {options.map(option => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
);

export const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-gray-800">{title}</h3>
          <Button onClick={onClose} className="bg-gray-200 text-gray-700 hover:bg-gray-300">
            &times;
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
};
