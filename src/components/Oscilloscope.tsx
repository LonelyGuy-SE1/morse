import { useEffect, useRef } from 'react';
import { audioEngine } from '../services/audioEngine';

interface OscilloscopeProps {
  color?: 'amber' | 'green' | 'cyan';
  height?: number;
}

export const Oscilloscope = ({
  color = 'green',
  height = 90,
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

      // Dark CRT background with slight trail
      ctx.fillStyle = '#080a0f';
      ctx.fillRect(0, 0, width, h);

      // Draw subtle oscilloscope grid lines
      ctx.strokeStyle = '#151b28';
      ctx.lineWidth = 1;
      ctx.beginPath();
      // Horizontal center & divisions
      for (let y = 15; y < h; y += 15) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      // Vertical divisions
      for (let x = 20; x < width; x += 25) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
      }
      ctx.stroke();

      if (!analyser) {
        // Flat baseline when idle
        ctx.strokeStyle = color === 'green' ? '#10b98144' : color === 'amber' ? '#f59e0b44' : '#06b6d444';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, h / 2);
        ctx.lineTo(width, h / 2);
        ctx.stroke();
        return;
      }

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteTimeDomainData(dataArray);

      // Determine glow and stroke colors
      let strokeColor = '#10b981';
      let glowColor = 'rgba(16, 185, 129, 0.4)';
      if (color === 'amber') {
        strokeColor = '#f59e0b';
        glowColor = 'rgba(245, 158, 11, 0.4)';
      } else if (color === 'cyan') {
        strokeColor = '#06b6d4';
        glowColor = 'rgba(6, 182, 212, 0.4)';
      }

      // Check if sound is actively playing
      let isSilent = true;
      for (let i = 0; i < bufferLength; i++) {
        if (Math.abs(dataArray[i] - 128) > 3) {
          isSilent = false;
          break;
        }
      }

      ctx.lineWidth = isSilent ? 1.5 : 2.5;
      ctx.strokeStyle = isSilent ? `${strokeColor}55` : strokeColor;
      ctx.shadowBlur = isSilent ? 2 : 10;
      ctx.shadowColor = glowColor;

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

      // Reset shadow blur
      ctx.shadowBlur = 0;
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [color]);

  return (
    <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-[#080a0f] p-1.5 shadow-inner">
      <div className="absolute top-2 left-3 flex items-center gap-2 pointer-events-none z-10">
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span className="font-mono text-[10px] tracking-wider uppercase text-slate-400 font-semibold">
          CW SCOPE // 500Ω S-METER
        </span>
      </div>
      <canvas
        ref={canvasRef}
        width={480}
        height={height}
        className="w-full h-full block rounded"
      />
    </div>
  );
};
