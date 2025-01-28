import React, { useState } from 'react';

interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
}

const Tooltip = ({ children, content }: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPosition({
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX
    });
    setIsVisible(true);
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className="absolute z-50 bg-white dark:bg-gray-800 text-sm rounded-lg shadow-lg p-2 min-w-[200px]"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            transform: 'translateY(8px)'
          }}
        >
          <div className="text-gray-900 dark:text-white">
            {content}
          </div>
        </div>
      )}
    </div>
  );
};

export default Tooltip;