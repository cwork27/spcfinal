'use client';

import { useState, useEffect } from 'react';

const TypewriterEffect = ({ text, delay = 0, smooth = false }: { text: string; delay?: number; smooth?: boolean }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (currentIndex < text.length) {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }
    }, 75);

    return () => clearTimeout(timeout);
  }, [currentIndex, text, delay]);

  useEffect(() => {
    const initialDelay = setTimeout(() => {
      setDisplayedText('');
      setCurrentIndex(0);
    }, delay);

    return () => clearTimeout(initialDelay);
  }, [delay]);

  return (
    <span className={smooth ? 'transition-opacity duration-1000 ease-in-out' : ''}>
      {displayedText}
    </span>
  );
};

export default TypewriterEffect;