import React, { useState, forwardRef } from 'react';

const eyeIcon = (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const eyeOffIcon = (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.88 9.88a3 3 0 0 0 4.24 4.24" />
    <path d="M10.73 5.08A10.45 10.45 0 0 1 12 5c7 0 11 7 11 7a13.16 13.16 0 0 1-2.11 2.88" />
    <path d="M6.61 6.61A13.526 13.526 0 0 0 1 12s4 7 11 7a10.94 10.94 0 0 0 5.39-1.42" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const PasswordInput = forwardRef((props, ref) => {
  const [showPassword, setShowPassword] = useState(false);

  const toggle = (e) => {
    e.preventDefault();
    setShowPassword(!showPassword);
  };

  return (
    <div className="password-toggle-wrapper" style={{ width: '100%', position: 'relative' }}>
      <input
        {...props}
        ref={ref}
        type={showPassword ? 'text' : 'password'}
      />
      <button
        type="button"
        className="password-toggle-button"
        aria-label={showPassword ? 'پنهان کردن رمز عبور' : 'نمایش رمز عبور'}
        onClick={toggle}
      >
        {showPassword ? eyeOffIcon : eyeIcon}
      </button>
    </div>
  );
});

PasswordInput.displayName = 'PasswordInput';

export default PasswordInput;
