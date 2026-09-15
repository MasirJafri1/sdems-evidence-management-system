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
          <label className="text-[11px] font-bold text-[#123B63] uppercase tracking-wider">
            {label}
          </label>
        )}
        <div className="relative flex items-center group">
          {leftIcon && (
            <div className="absolute left-3 text-[#5B6875] group-focus-within:text-[#123B63] transition-colors pointer-events-none flex items-center">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={`w-full rounded-md bg-white border text-[#17212B] placeholder-[#5B6875]/60 text-xs px-3.5 py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-[#123B63]/20 focus:border-[#123B63] shadow-2xs ${
              leftIcon ? 'pl-9' : ''
            } ${
              error ? 'border-[#B42318] focus:ring-[#B42318]/20' : 'border-[#DCE3EA]'
            } ${className}`}
            {...props}
          />
        </div>
        {error && <span className="text-xs text-[#B42318] font-medium">{error}</span>}
        {helperText && !error && (
          <span className="text-xs text-[#5B6875]">{helperText}</span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
