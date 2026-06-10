'use client';

import { useTheme } from './Themeprovider';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div style={{ width: '44px', height: '44px' }} />;
  }

  return (
    <>
      <style>{`
        .theme-toggle {
          position: relative;
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: var(--nav-btn-hover-bg);
          border: 1px solid var(--nav-border);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          color: var(--nav-text);
        }
        .theme-toggle:hover {
          background: var(--nav-btn-hover-bg);
          color: var(--nav-text-hover);
          border-color: var(--accent-primary);
          transform: translateY(-1px);
        }
        .theme-toggle svg {
          width: 20px;
          height: 20px;
          transition: all 0.3s;
        }
        .theme-toggle .sun-icon {
          display: ${theme === 'light' ? 'block' : 'none'};
        }
        .theme-toggle .moon-icon {
          display: ${theme === 'dark' ? 'block' : 'none'};
        }
        [data-theme="dark"] .theme-toggle .sun-icon {
          display: none;
        }
        [data-theme="dark"] .theme-toggle .moon-icon {
          display: block;
        }
      `}</style>

      <button
        className="theme-toggle"
        onClick={toggle}
        aria-label={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
      >
        {/* Sun Icon */}
        <svg className="sun-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 3v1m0 16v1m8.66-9H21m-18 0H2m14.95 5.66l-.71-.71M7.76 7.76l-.71-.71M19.07 7.05l-.71.71M6.34 17.66l-.71.71M12 5a7 7 0 100 14A7 7 0 0012 5z" />
        </svg>
        
        {/* Moon Icon */}
        <svg className="moon-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      </button>
    </>
  );
}