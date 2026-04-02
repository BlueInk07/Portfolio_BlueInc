import { useEffect, useRef } from 'react';
import { useAnimationBudget } from '../hooks/usePerformanceProfile';

const NebulaBackground = ({ isActive = true }) => {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);
  const lastFrameRef = useRef(0);
  const { shouldAnimate, targetFps } = useAnimationBudget(isActive);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !shouldAnimate) return undefined;
    const ctx = canvas.getContext('2d');

    const off    = document.createElement('canvas');
    const offCtx = off.getContext('2d');

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      off.width  = Math.floor(canvas.width  / 3);
      off.height = Math.floor(canvas.height / 3);
    };
    resize();
    window.addEventListener('resize', resize);

    // ALL blues — no purples, no cyans, matches the portfolio palette
    const blobs = [
      { x: 0.20, y: 0.45, vx:  0.00009, vy:  0.00006, r: 0.52, color: [15,  55, 180], op: 0.50 }, // deep blue
      { x: 0.72, y: 0.55, vx: -0.00007, vy:  0.00008, r: 0.46, color: [20,  80, 220], op: 0.45 }, // royal blue
      { x: 0.48, y: 0.32, vx:  0.00006, vy: -0.00009, r: 0.42, color: [30, 100, 255], op: 0.38 }, // bright blue
      { x: 0.14, y: 0.65, vx:  0.00010, vy: -0.00005, r: 0.36, color: [10,  40, 160], op: 0.42 }, // dark navy blue
      { x: 0.82, y: 0.25, vx: -0.00008, vy:  0.00007, r: 0.38, color: [25,  90, 240], op: 0.35 }, // electric blue
      { x: 0.60, y: 0.75, vx:  0.00005, vy: -0.00010, r: 0.32, color: [8,   50, 200], op: 0.38 }, // medium blue
      { x: 0.38, y: 0.55, vx: -0.00006, vy:  0.00011, r: 0.28, color: [40, 120, 255], op: 0.28 }, // lighter blue
    ];

    const streaks = [
      { phase: 0.0, speed: 0.003,  color: [20,  70, 210] },
      { phase: 1.6, speed: 0.002,  color: [30, 100, 255] },
      { phase: 3.2, speed: 0.0025, color: [15,  55, 190] },
      { phase: 4.8, speed: 0.0015, color: [25,  85, 235] },
    ];

    let t = 0;

    const frameInterval = 1000 / targetFps;

    const draw = (timestamp = 0) => {
      if (timestamp - lastFrameRef.current < frameInterval) {
        animRef.current = requestAnimationFrame(draw);
        return;
      }
      lastFrameRef.current = timestamp;

      const W  = canvas.width;
      const H  = canvas.height;
      const OW = off.width;
      const OH = off.height;

      // ── Offscreen blobs ──────────────────────────────────────
      offCtx.clearRect(0, 0, OW, OH);

      blobs.forEach(b => {
        b.x += b.vx;
        b.y += b.vy;
        if (b.x < -0.15 || b.x > 1.15) b.vx *= -1;
        if (b.y < -0.15 || b.y > 1.15) b.vy *= -1;

        const cx     = b.x * OW;
        const cy     = b.y * OH;
        const pulse  = 1 + Math.sin(t * 0.007 + b.x * 8) * 0.07;
        const radius = b.r * Math.min(OW, OH) * pulse;
        const [r, g, bl] = b.color;

        const grad = offCtx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        grad.addColorStop(0,    `rgba(${r},${g},${bl},${b.op})`);
        grad.addColorStop(0.30, `rgba(${r},${g},${bl},${b.op * 0.75})`);
        grad.addColorStop(0.60, `rgba(${r},${g},${bl},${b.op * 0.35})`);
        grad.addColorStop(0.85, `rgba(${r},${g},${bl},${b.op * 0.08})`);
        grad.addColorStop(1,    `rgba(${r},${g},${bl},0)`);

        offCtx.beginPath();
        offCtx.arc(cx, cy, radius, 0, Math.PI * 2);
        offCtx.fillStyle = grad;
        offCtx.fill();
      });

      // ── Main canvas — NO opaque base fill ───────────────────
      // clearRect makes canvas transparent so .app gradient shows through
      ctx.clearRect(0, 0, W, H);

      // Wide soft blob layer
      ctx.save();
      ctx.filter = 'blur(40px)';
      ctx.globalAlpha = 0.80;
      ctx.drawImage(off, 0, 0, W, H);
      ctx.restore();

      // Tighter glow pass
      ctx.save();
      ctx.filter = 'blur(16px)';
      ctx.globalAlpha = 0.25;
      ctx.drawImage(off, 0, 0, W, H);
      ctx.restore();

      // ── Streaks ──────────────────────────────────────────────
      ctx.save();
      ctx.filter = 'blur(3px)';
      streaks.forEach((s, i) => {
        const sx  = (Math.sin(t * s.speed + s.phase)            * 0.38 + 0.5) * W;
        const sy  = (Math.cos(t * s.speed * 0.7  + s.phase)     * 0.32 + 0.5) * H;
        const ex  = (Math.sin(t * s.speed + s.phase + 1.3)      * 0.38 + 0.5) * W;
        const ey  = (Math.cos(t * s.speed * 0.7  + s.phase + 1) * 0.32 + 0.5) * H;
        const cpx = (sx + ex) / 2 + Math.sin(t * 0.004 + i * 1.3) * 100;
        const cpy = (sy + ey) / 2 + Math.cos(t * 0.003 + i * 1.1) * 75;

        const [r, g, bl] = s.color;
        const sg = ctx.createLinearGradient(sx, sy, ex, ey);
        sg.addColorStop(0,    `rgba(${r},${g},${bl},0)`);
        sg.addColorStop(0.35, `rgba(${r},${g},${bl},0.07)`);
        sg.addColorStop(0.5,  `rgba(${r},${g},${bl},0.14)`);
        sg.addColorStop(0.65, `rgba(${r},${g},${bl},0.07)`);
        sg.addColorStop(1,    `rgba(${r},${g},${bl},0)`);

        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.quadraticCurveTo(cpx, cpy, ex, ey);
        ctx.strokeStyle = sg;
        ctx.lineWidth   = 20 + Math.sin(t * 0.005 + i) * 6;
        ctx.stroke();
      });
      ctx.restore();

      // ── Fades — transparent to transparent, no solid color ──
      // These just darken the top/bottom edges slightly so the
      // nebula glow doesn't bleed hard into the section edges.
      // The actual color comes from the .app gradient behind.
      ctx.filter = 'none';

      const topFade = ctx.createLinearGradient(0, 0, 0, H * 0.28);
      topFade.addColorStop(0, 'rgba(5,14,32,0.95)');
      topFade.addColorStop(1, 'rgba(5,14,32,0)');
      ctx.fillStyle = topFade;
      ctx.fillRect(0, 0, W, H * 0.28);

      const botFade = ctx.createLinearGradient(0, H * 0.80, 0, H);
      botFade.addColorStop(0, 'rgba(3,10,24,0)');
      botFade.addColorStop(1, 'rgba(3,10,24,0.95)');
      ctx.fillStyle = botFade;
      ctx.fillRect(0, H * 0.80, W, H * 0.20);

      t++;
      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [shouldAnimate, targetFps]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
};

export default NebulaBackground;
