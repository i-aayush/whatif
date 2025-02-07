import React, { useState, ReactNode } from 'react';

interface TooltipProps {
  children: ReactNode;
  content: string;
  position?: 'top' | 'bottom';
}

export function Tooltip({ children, content, position = 'bottom' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const tooltipClasses = position === 'top' 
    ? 'bottom-full mb-2' // Position above with margin bottom
    : 'top-full mt-2';   // Position below with margin top

  const arrowClasses = position === 'top'
    ? 'bottom-0 translate-y-1/2 rotate-45'  // Arrow pointing down
    : 'top-0 -translate-y-1/2 rotate-45';   // Arrow pointing up

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      {isVisible && (
        <div className={`fixed z-[9999] ${tooltipClasses}`} style={{ 
          left: 'var(--tooltip-x)',
          top: 'var(--tooltip-y)'
        }}
          ref={(el) => {
            if (el) {
              const rect = el.parentElement?.getBoundingClientRect();
              if (rect) {
                const x = rect.left + (rect.width / 2);
                const y = position === 'top' 
                  ? rect.top - 10
                  : rect.bottom + 10;
                el.style.setProperty('--tooltip-x', `${x}px`);
                el.style.setProperty('--tooltip-y', `${y}px`);
              }
            }
          }}
        >
          <div className="relative transform -translate-x-1/2">
            <div className="px-3 py-2 text-sm text-white bg-gray-900 rounded-md shadow-lg whitespace-nowrap">
              {content}
            </div>
            <div className={`absolute left-1/2 -translate-x-1/2 ${arrowClasses} w-2 h-2 bg-gray-900`}></div>
          </div>
        </div>
      )}
    </div>
  );
} 