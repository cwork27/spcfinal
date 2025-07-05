'use client';

import { useState, useEffect } from 'react';

const MadeSimpleSmooth = ({ text }: { text: string }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1675); // Adjusted delay to appear with typewriter effect completion
    return () => clearTimeout(timer);
  }, []);

  return (
    <span className={`transition-opacity duration-1000 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      {text}
    </span>
  );
};

export default MadeSimpleSmooth;