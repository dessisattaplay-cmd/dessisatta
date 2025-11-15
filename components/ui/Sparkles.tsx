
import React, { useEffect, useState } from 'react';

const Sparkle: React.FC<{ style: React.CSSProperties }> = ({ style }) => (
  <div className="absolute w-2 h-2 bg-yellow-300 rounded-full animate-sparkle" style={style}></div>
);

const Sparkles: React.FC<{ trigger: any }> = ({ trigger }) => {
  const [sparkles, setSparkles] = useState<{ id: number; style: React.CSSProperties }[]>([]);

  useEffect(() => {
    if (trigger) {
      const newSparkles = Array.from({ length: 20 }).map((_, i) => ({
        id: Math.random(),
        style: {
          top: `${Math.random() * 100}%`,
          left: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 0.5}s`,
        },
      }));
      setSparkles(newSparkles);

      const timer = setTimeout(() => setSparkles([]), 1000); // Clear sparkles after animation
      return () => clearTimeout(timer);
    }
  }, [trigger]);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {sparkles.map(({ id, style }) => (
        <div key={id} className="absolute inset-0 animate-firework" style={{ transform: `rotate(${Math.random() * 360}deg)` }}>
           <div className="absolute w-1 h-1 bg-yellow-300 rounded-full" style={{...style, animation: `sparkle-effect 1s ease-out forwards`, animationDelay: `${Math.random() * 0.2}s` }} />
        </div>
      ))}
      <style>{`
        @keyframes sparkle-effect {
          0% { transform: scale(0); opacity: 1; }
          50% { opacity: 1; }
          100% { transform: scale(2) translateX(${Math.random() * 60 - 30}px) translateY(${Math.random() * 60 - 30}px); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default Sparkles;
