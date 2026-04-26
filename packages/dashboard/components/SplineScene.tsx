"use client";

import React, { useEffect, useRef, useState } from "react";

interface SplineSceneProps {
  sceneUrl: string;
  className?: string;
  style?: React.CSSProperties;
}

const SplineScene: React.FC<SplineSceneProps> = ({ sceneUrl, className, style }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function initSpline() {
      if (!canvasRef.current) return;

      try {
        // Dynamic import to avoid SSR crashes
        const { Application } = await import("@splinetool/runtime");
        
        appRef.current = new Application(canvasRef.current);
        
        // Listen for the load event to hide the skeleton
        appRef.current.addEventListener("load", () => {
          setIsLoading(false);
        });

        await appRef.current.load(sceneUrl);
      } catch (error) {
        console.error("Failed to load Spline scene:", error);
        setIsLoading(false);
      }
    }

    initSpline();

    return () => {
      if (appRef.current && typeof appRef.current.dispose === "function") {
        appRef.current.dispose();
      }
    };
  }, [sceneUrl]);

  return (
    <div 
      className={`relative w-full h-full overflow-hidden ${className || ""}`} 
      style={style}
    >
      {/* Loading Skeleton */}
      {isLoading && (
        <div className="absolute inset-0 z-10 animate-pulse bg-white/5 rounded-2xl flex items-center justify-center">
          <div className="w-12 h-12 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        </div>
      )}
      
      <canvas 
        ref={canvasRef} 
        className="w-full h-full"
      />
    </div>
  );
};

export default SplineScene;
