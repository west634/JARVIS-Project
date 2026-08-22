import { useEffect, useRef } from "react";
import type { AssistantState } from "../types/assistant";

const STATE_COLOR: Record<AssistantState, string> = {
  IDLE: "78, 232, 211",
  LISTENING: "78, 232, 211",
  PROCESSING: "78, 232, 211",
  THINKING: "111, 251, 232",
  SPEAKING: "242, 185, 87",
  ERROR: "255, 107, 107",
};

const BAR_COUNT = 56;
const BAR_SEEDS = Array.from({ length: BAR_COUNT }, () => 0.4 + Math.random() * 0.6);

export function AIVisualizer({ state, level }: { state: AssistantState; level: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef(state);
  const levelRef = useRef(level);
  const smoothedLevelRef = useRef(0);

  useEffect(() => {
    stateRef.current = state;
    levelRef.current = level;
  }, [state, level]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const size = canvas.clientWidth;
      canvas.width = size * dpr;
      canvas.height = size * dpr;
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    const start = performance.now();

    const draw = (now: number) => {
      const t = (now - start) / 1000;
      const size = canvas.width;
      const cx = size / 2;
      const cy = size / 2;
      const radius = size * 0.32;
      const s = stateRef.current;
      const color = STATE_COLOR[s];
      const active = s === "LISTENING" || s === "SPEAKING";

      smoothedLevelRef.current += ((active ? levelRef.current : 0) - smoothedLevelRef.current) * 0.25;
      const currentLevel = smoothedLevelRef.current;

      ctx.clearRect(0, 0, size, size);

      // Ambient glow
      const glowStrength = s === "ERROR" ? 0.35 : 0.22 + currentLevel * 0.5;
      const glow = ctx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius * 1.9);
      glow.addColorStop(0, `rgba(${color}, ${glowStrength})`);
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, size, size);

      // Concentric rings
      const ringSpeed = s === "THINKING" ? 0.6 : s === "PROCESSING" ? 0.9 : 0.18;
      const ringDefs = [
        { r: radius * 1.55, dash: [2, 10], width: 1, dir: 1, alpha: 0.35 },
        { r: radius * 1.3, dash: [10, 6], width: 1, dir: -1, alpha: 0.45 },
        { r: radius * 1.05, dash: [1, 0], width: 1.5, dir: 1, alpha: 0.6 },
      ];
      for (const ring of ringDefs) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(t * ringSpeed * ring.dir);
        ctx.beginPath();
        ctx.setLineDash(ring.dash.map((d) => d * dpr));
        ctx.lineWidth = ring.width * dpr;
        ctx.strokeStyle = `rgba(${color}, ${ring.alpha})`;
        ctx.arc(0, 0, ring.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Error state: draw a broken/jagged ring instead of the waveform.
      if (s === "ERROR") {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.beginPath();
        ctx.strokeStyle = `rgba(${color}, 0.9)`;
        ctx.lineWidth = 2 * dpr;
        const segs = 40;
        for (let i = 0; i <= segs; i++) {
          const a = (i / segs) * Math.PI * 2;
          const jitter = Math.sin(i * 13.1 + t * 4) * 6 * dpr;
          const r = radius * 0.62 + jitter;
          const x = Math.cos(a) * r;
          const y = Math.sin(a) * r;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
      } else {
        // Central waveform band
        ctx.save();
        ctx.translate(cx, cy);
        const bandWidth = radius * 1.5;
        const baseAmp = s === "THINKING" ? 0.22 : s === "PROCESSING" ? 0.16 : 0.08;
        const reactiveAmp = 0.34 + currentLevel * 1.4;
        ctx.beginPath();
        ctx.lineWidth = 2.2 * dpr;
        ctx.strokeStyle = `rgba(${color}, 0.95)`;
        ctx.lineCap = "round";
        for (let i = 0; i < BAR_COUNT; i++) {
          const x = -bandWidth / 2 + (i / (BAR_COUNT - 1)) * bandWidth;
          const seed = BAR_SEEDS[i];
          const wave =
            Math.sin(i * 0.5 + t * (active ? 5 : 2.2)) * baseAmp +
            Math.sin(i * 0.19 + t * (active ? 3.1 : 1.3)) * reactiveAmp * seed;
          const h = Math.max(2 * dpr, Math.abs(wave) * radius * 0.9);
          ctx.moveTo(x, -h / 2);
          ctx.lineTo(x, h / 2);
        }
        ctx.stroke();
        ctx.restore();
      }

      // Core dot
      ctx.beginPath();
      ctx.fillStyle = `rgba(${color}, 0.9)`;
      ctx.arc(cx, cy, (3 + currentLevel * 3) * dpr, 0, Math.PI * 2);
      ctx.fill();

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="aspect-square w-full max-w-[360px] mx-auto block"
      role="img"
      aria-label={`AI visualizer, state: ${state}`}
    />
  );
}
