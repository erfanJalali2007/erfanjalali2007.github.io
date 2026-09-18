import React, { useEffect, useRef } from 'react';
import { GlassTheme } from '../types';

interface LiquidCanvasProps {
  theme: GlassTheme;
  pointerPos: { x: number; y: number };
  intensity: number; // 0 to 1
  ripplesTrigger?: { x: number; y: number; timestamp: number } | null;
}

interface WaveRipple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  speed: number;
  opacity: number;
  decay: number;
}

export const LiquidCanvas: React.FC<LiquidCanvasProps> = ({
  theme,
  pointerPos,
  intensity,
  ripplesTrigger,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ripplesRef = useRef<WaveRipple[]>([]);
  const lastPointerRef = useRef({ x: 0, y: 0 });
  const themeRef = useRef(theme);

  // Keep themeRef current for the animation frame render loop
  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  // Handle manual clicks / ripples
  useEffect(() => {
    if (!ripplesTrigger) return;
    ripplesRef.current.push({
      x: ripplesTrigger.x,
      y: ripplesTrigger.y,
      radius: 4,
      maxRadius: Math.max(window.innerWidth, window.innerHeight) * 0.45,
      speed: 4.2,
      opacity: 0.6,
      decay: 0.009,
    });
  }, [ripplesTrigger]);

  // Handle pointer glide ripples (throttled by distance)
  useEffect(() => {
    const dx = pointerPos.x - lastPointerRef.current.x;
    const dy = pointerPos.y - lastPointerRef.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 35 && ripplesRef.current.length < 18) {
      lastPointerRef.current = { x: pointerPos.x, y: pointerPos.y };
      ripplesRef.current.push({
        x: pointerPos.x,
        y: pointerPos.y,
        radius: 6,
        maxRadius: 180 + intensity * 100,
        speed: 2.8,
        opacity: 0.35,
        decay: 0.018,
      });
    }
  }, [pointerPos, intensity]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const render = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      ctx.clearRect(0, 0, width, height);

      const aura = themeRef.current.pointerAura;

      // Render ripples with theme-matched chromatic caustics instead of plain white
      for (let i = ripplesRef.current.length - 1; i >= 0; i--) {
        const r = ripplesRef.current[i];
        r.radius += r.speed;
        r.opacity -= r.decay;

        if (r.opacity <= 0.01 || r.radius >= r.maxRadius) {
          ripplesRef.current.splice(i, 1);
          continue;
        }

        // Draw caustic concentric liquid wave
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);

        // Gradient refraction stroke with theme aura chromatic tones
        const grad = ctx.createRadialGradient(r.x, r.y, Math.max(0, r.radius - 8), r.x, r.y, r.radius + 8);
        grad.addColorStop(0, `rgba(${aura.primaryRgb}, 0)`);
        grad.addColorStop(0.5, `rgba(${aura.primaryRgb}, ${r.opacity * 0.55})`);
        grad.addColorStop(1, `rgba(${aura.secondaryRgb}, 0)`);

        ctx.strokeStyle = grad;
        ctx.lineWidth = 4 + (r.radius / r.maxRadius) * 8;
        ctx.stroke();

        // Inner caustic specular highlight matching theme radiance
        if (r.radius > 20) {
          ctx.beginPath();
          ctx.arc(r.x, r.y, Math.max(1, r.radius - 12), 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${aura.highlightRgb}, ${r.opacity * 0.38})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Dynamic Liquid Chromatic Blobs */}
      <div
        className="absolute w-[680px] h-[680px] -top-32 -left-20 rounded-full animate-liquid-1 liquid-caustic-glow transition-all duration-1000 opacity-70"
        style={{ background: theme.liquidBlobs.color1 }}
      />
      <div
        className="absolute w-[720px] h-[720px] -bottom-32 -right-24 rounded-full animate-liquid-2 liquid-caustic-glow transition-all duration-1000 opacity-65"
        style={{ background: theme.liquidBlobs.color2 }}
      />
      <div
        className="absolute w-[540px] h-[540px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full animate-liquid-3 liquid-caustic-glow transition-all duration-1000 opacity-55"
        style={{ background: theme.liquidBlobs.color3 }}
      />

      {/* Dynamic Ambient Mouse Spotlight Aura matching background palette */}
      <div
        className="pointer-events-none absolute w-[420px] h-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-150 ease-out liquid-caustic-glow mix-blend-screen"
        style={{
          left: `${pointerPos.x}px`,
          top: `${pointerPos.y}px`,
          background: theme.pointerAura.cssGradient,
          opacity: 0.92 * intensity,
        }}
      />
      {/* Radiant inner core following cursor */}
      <div
        className="pointer-events-none absolute w-[150px] h-[150px] -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-75 ease-out filter blur-2xl mix-blend-screen"
        style={{
          left: `${pointerPos.x}px`,
          top: `${pointerPos.y}px`,
          background: `radial-gradient(circle, rgba(${theme.pointerAura.primaryRgb}, 0.5) 0%, rgba(${theme.pointerAura.secondaryRgb}, 0.2) 50%, transparent 80%)`,
          opacity: 0.85 * intensity,
        }}
      />

      {/* Interactive Liquid Caustic Ripple Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full opacity-85"
      />

      {/* Optical Grain Texture for Physical Glass Caustics */}
      <div 
        className="absolute inset-0 opacity-[0.035] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
};
