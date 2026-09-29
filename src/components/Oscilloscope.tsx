import { useEffect, useRef } from 'react';
import { audioEngine } from '../services/audioEngine';

interface OscilloscopeProps {
  height?: number;
}

export const Oscilloscope = ({
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

      // Pure Neo-Brutalist canvas styling
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, h);

      // Subtle Grid lines
      ctx.strokeStyle = '#f0eee6';
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
        ctx.strokeStyle = '#18181b';
        ctx.lineWidth = 2;
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

      ctx.strokeStyle = isSilent ? '#a1a1aa' : '#ff5500';
      ctx.lineWidth = 2.5;

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
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-neutral-900 bg-white shadow-[3px_3px_0px_0px_#18181b] p-2">
      <div className="absolute top-2.5 left-3.5 flex items-center gap-2 pointer-events-none z-10">
        <span className="inline-block w-2 h-2 rounded-full bg-[#ff5500]" />
        <span className="font-mono text-[10px] tracking-wider uppercase font-bold text-neutral-700">
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
