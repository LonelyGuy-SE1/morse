import { useEffect, useRef } from 'react';
import { audioEngine } from '../services/audioEngine';
import type { ThemeMode } from '../types/morse';

interface OscilloscopeProps {
  theme?: ThemeMode;
  height?: number;
}

export const Oscilloscope = ({
  theme = 'neo-brutal',
  height = 70,
}: OscilloscopeProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      animationFrameId = requestAnimationFrame(render);

      const analyser = audioEngine.getAnalyser();
      const width = canvas.width;
      const h = canvas.height;

      // Color scheme based on theme
      const isBrutal = theme === 'neo-brutal';
      const isDark = theme === 'apple-dark';

      // Background
      ctx.fillStyle = isBrutal ? '#ffffff' : isDark ? '#0c0d11' : '#ffffff';
      ctx.fillRect(0, 0, width, h);

      // Subtle Grid lines
      ctx.strokeStyle = isBrutal ? '#f0eee6' : isDark ? '#1a1c24' : '#f1f5f9';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let y = 15; y < h; y += 15) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      for (let x = 25; x < width; x += 30) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
      }
      ctx.stroke();

      if (!analyser) {
        ctx.strokeStyle = isBrutal ? '#18181b' : isDark ? '#3b82f6' : '#2563eb';
        ctx.lineWidth = isBrutal ? 2 : 1.5;
        ctx.beginPath();
        ctx.moveTo(0, h / 2);
        ctx.lineTo(width, h / 2);
        ctx.stroke();
        return;
      }

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteTimeDomainData(dataArray);

      let isSilent = true;
      for (let i = 0; i < bufferLength; i++) {
        if (Math.abs(dataArray[i] - 128) > 3) {
          isSilent = false;
          break;
        }
      }

      // Stroke style
      if (isBrutal) {
        ctx.strokeStyle = isSilent ? '#a1a1aa' : '#ff5500';
        ctx.lineWidth = 2.5;
        ctx.shadowBlur = 0;
      } else if (isDark) {
        ctx.strokeStyle = isSilent ? 'rgba(59, 130, 246, 0.4)' : '#60a5fa';
        ctx.lineWidth = isSilent ? 1.5 : 2.5;
        ctx.shadowBlur = isSilent ? 0 : 8;
        ctx.shadowColor = 'rgba(96, 165, 250, 0.6)';
      } else {
        ctx.strokeStyle = isSilent ? '#cbd5e1' : '#2563eb';
        ctx.lineWidth = isSilent ? 1.5 : 2;
        ctx.shadowBlur = 0;
      }

      ctx.beginPath();
      const sliceWidth = width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * h) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(width, h / 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme]);

  const isBrutal = theme === 'neo-brutal';
  const isDark = theme === 'apple-dark';

  return (
    <div className={`relative overflow-hidden transition-all ${
      isBrutal
        ? 'rounded-2xl border-2 border-neutral-900 bg-white shadow-[3px_3px_0px_0px_#18181b]'
        : isDark
        ? 'rounded-2xl border border-white/[0.08] bg-[#0c0d11] shadow-lg'
        : 'rounded-2xl border border-neutral-200 bg-white shadow-sm'
    } p-2`}>
      <div className="absolute top-2.5 left-3.5 flex items-center gap-2 pointer-events-none z-10">
        <span className={`inline-block w-2 h-2 rounded-full ${
          isBrutal ? 'bg-[#ff5500]' : isDark ? 'bg-blue-400 animate-pulse' : 'bg-blue-600'
        }`} />
        <span className={`font-mono text-[10px] tracking-wider uppercase font-bold ${
          isBrutal ? 'text-neutral-700' : isDark ? 'text-neutral-400' : 'text-neutral-500'
        }`}>
          CARRIER MONITOR // REAL-TIME SPECTRUM
        </span>
      </div>
      <canvas
        ref={canvasRef}
        width={480}
        height={height}
        className="w-full h-full block rounded-xl"
      />
    </div>
  );
};
