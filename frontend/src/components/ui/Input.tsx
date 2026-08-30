import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, className = '', ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1">
        {label && (
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 text-slate-500 pointer-events-none flex items-center">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={`w-full rounded bg-white border text-slate-900 placeholder-slate-400 text-sm px-3 py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-800 ${
              leftIcon ? 'pl-9' : ''
            } ${
              error ? 'border-red-600 focus:ring-red-300' : 'border-slate-300 hover:border-slate-400'
            } ${className}`}
            {...props}
          />
        </div>
        {error && <span className="text-xs text-red-600 font-medium">{error}</span>}
        {helperText && !error && (
          <span className="text-xs text-slate-500">{helperText}</span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
