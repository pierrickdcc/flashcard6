import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';

const FitText = ({ children, className }) => {
  const containerRef = useRef(null);
  const textRef = useRef(null);

  useLayoutEffect(() => {
    const resizeText = () => {
      if (!containerRef.current || !textRef.current) {
        return;
      }

      const container = containerRef.current;
      const text = textRef.current;

      let minFontSize = 10; // Minimum font size in pixels
      let maxFontSize = 120; // Maximum font size in pixels
      let currentSize = maxFontSize;

      // Binary search for the optimal font size
      while (minFontSize <= maxFontSize) {
        currentSize = Math.floor((minFontSize + maxFontSize) / 2);
        text.style.fontSize = `${currentSize}px`;

        if (text.scrollWidth <= container.clientWidth && text.scrollHeight <= container.clientHeight) {
          minFontSize = currentSize + 1; // Try a larger font size
        } else {
          maxFontSize = currentSize - 1; // Try a smaller font size
        }
      }

      // Set the final font size (it's maxFontSize because the loop exits when min > max)
      text.style.fontSize = `${maxFontSize}px`;
    };

    resizeText();

    const observer = new ResizeObserver(resizeText);
    if (containerRef.current) {
        observer.observe(containerRef.current);
    }

    window.addEventListener('resize', resizeText);

    return () => {
        if (containerRef.current) {
            observer.unobserve(containerRef.current);
        }
        window.removeEventListener('resize', resizeText);
    };
  }, [children]);

  return (
    <div ref={containerRef} className={className} style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <span ref={textRef} style={{ textAlign: 'center', wordBreak: 'break-word', hyphens: 'auto' }}>
        {children}
      </span>
    </div>
  );
};

export default FitText;
