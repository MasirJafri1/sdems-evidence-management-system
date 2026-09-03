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
        <div className="relative flex items-center group">
          {leftIcon && (
            <div className="absolute left-3.5 text-slate-400 group-focus-within:text-amber-600 transition-colors pointer-events-none flex items-center">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={`w-full rounded-lg bg-slate-50/50 border text-slate-900 placeholder-slate-400 text-sm px-4 py-2.5 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white shadow-sm hover:border-slate-300 ${
              leftIcon ? 'pl-10' : ''
            } ${
              error ? 'border-red-600 focus:ring-red-300/50' : 'border-slate-200'
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
