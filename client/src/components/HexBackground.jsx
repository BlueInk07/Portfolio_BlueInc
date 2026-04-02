import { useEffect, useRef } from 'react';
import { useAnimationBudget } from '../hooks/usePerformanceProfile';

export default function HexBackground({ isActive = true }) {
  const canvasRef = useRef(null);
  const lastFrameRef = useRef(0);
  const { shouldAnimate, targetFps } = useAnimationBudget(isActive);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !shouldAnimate) return undefined;
    const ctx = canvas.getContext('2d');
    let animId;
    let time = 0;

    const R = 72;
    const W_HEX = R * Math.sqrt(3);
    const H_HEX = R * 2;
    const COL_W = W_HEX;
    const ROW_H = H_HEX * 0.75;

    function hexVerts(cx, cy) {
      const pts = [];
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 6;
        pts.push({ x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) });
      }
      return pts;
    }

    function buildHexes(W, H) {
      const hexes = [];
      const cols = Math.ceil(W / COL_W) + 2;
      const rows = Math.ceil(H / ROW_H) + 2;
      for (let row = -1; row < rows; row++) {
        for (let col = -1; col < cols; col++) {
          const cx = col * COL_W + (row % 2 !== 0 ? COL_W / 2 : 0);
          const cy = row * ROW_H;
          hexes.push({ cx, cy, verts: hexVerts(cx, cy) });
        }
      }
      return hexes;
    }

    function resize() {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const frameInterval = 1000 / targetFps;

    function draw(timestamp = 0) {
      if (timestamp - lastFrameRef.current < frameInterval) {
        animId = requestAnimationFrame(draw);
        return;
      }
      lastFrameRef.current = timestamp;

      const W = canvas.width;
      const H = canvas.height;

      time += 0.008;
      const pulse1 = 0.7 + 0.3 * Math.sin(time * 0.8);
      const pulse2 = 0.7 + 0.3 * Math.sin(time * 0.6 + 2.1);

      const h1x = W * 0.60, h1y = H * 0.22;
      const h2x = W * 0.08, h2y = H * 0.78;

      ctx.clearRect(0, 0, W, H);

      const hexes = buildHexes(W, H);
      const maxD = Math.max(W, H) * 0.55;

      for (const { cx, cy, verts } of hexes) {
        const d1 = Math.hypot(cx - h1x, cy - h1y);
        const d2 = Math.hypot(cx - h2x, cy - h2y);
        const g1 = Math.max(0, 1 - d1 / maxD) * pulse1;
        const g2 = Math.max(0, 1 - d2 / maxD) * pulse2;

        // Very dark fill — barely tinted
        ctx.beginPath();
        ctx.moveTo(verts[0].x, verts[0].y);
        for (let i = 1; i < 6; i++) ctx.lineTo(verts[i].x, verts[i].y);
        ctx.closePath();
        const fillR = Math.round(g1 * 4  + g2 * 2);
        const fillG = Math.round(g1 * 8  + g2 * 5);
        const fillB = Math.round(g1 * 22 + g2 * 25 + 4);
        ctx.fillStyle = `rgb(${fillR}, ${fillG}, ${fillB})`;
        ctx.fill();

        // Outer soft glow — hotspot 1 (reduced width + alpha)
        if (g1 > 0.05) {
          ctx.beginPath();
          ctx.moveTo(verts[0].x, verts[0].y);
          for (let i = 1; i < 6; i++) ctx.lineTo(verts[i].x, verts[i].y);
          ctx.closePath();
          const a1 = g1 * g1 * 0.9;
          ctx.strokeStyle = `rgba(60, 160, 255, ${a1 * 0.12})`;
          ctx.lineWidth = 5;
          ctx.stroke();
        }

        // Outer soft glow — hotspot 2 dark blue (reduced)
        if (g2 > 0.05) {
          ctx.beginPath();
          ctx.moveTo(verts[0].x, verts[0].y);
          for (let i = 1; i < 6; i++) ctx.lineTo(verts[i].x, verts[i].y);
          ctx.closePath();
          const a2 = g2 * g2 * 0.9;
          ctx.strokeStyle = `rgba(30, 60, 200, ${a2 * 0.12})`;
          ctx.lineWidth = 5;
          ctx.stroke();
        }

        // Inner neon line — thinner, more transparent
        ctx.beginPath();
        ctx.moveTo(verts[0].x, verts[0].y);
        for (let i = 1; i < 6; i++) ctx.lineTo(verts[i].x, verts[i].y);
        ctx.closePath();
        const total = g1 + g2 + 0.001;
        const blendR = Math.round((g1 * 80  + g2 * 20)  / total);
        const blendG = Math.round((g1 * 140 + g2 * 50)  / total);
        const blendB = Math.round((g1 * 255 + g2 * 220) / total);
        const lineAlpha = Math.min(1, (g1 * g1 + g2 * g2) * 1.4);
        ctx.strokeStyle = `rgba(${blendR}, ${blendG}, ${blendB}, ${lineAlpha * 0.28})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Vertex halos — hotspot 1 (only very close hexes, smaller radius)
        if (g1 > 0.6) {
          for (const v of verts) {
            const vd = Math.hypot(v.x - h1x, v.y - h1y);
            const vg = Math.max(0, 1 - vd / (maxD * 0.4)) * g1;
            if (vg < 0.1) continue;
            const rg = ctx.createRadialGradient(v.x, v.y, 0, v.x, v.y, 12 * vg);
            rg.addColorStop(0,   `rgba(180, 230, 255, ${vg * 0.5})`);
            rg.addColorStop(0.4, `rgba(60,  160, 255, ${vg * 0.25})`);
            rg.addColorStop(1,   `rgba(20,  80,  255, 0)`);
            ctx.beginPath();
            ctx.arc(v.x, v.y, 12 * vg, 0, Math.PI * 2);
            ctx.fillStyle = rg;
            ctx.fill();
          }
        }

        // Vertex halos — hotspot 2 dark blue (only very close)
        if (g2 > 0.6) {
          for (const v of verts) {
            const vd = Math.hypot(v.x - h2x, v.y - h2y);
            const vg = Math.max(0, 1 - vd / (maxD * 0.4)) * g2;
            if (vg < 0.1) continue;
            const rg = ctx.createRadialGradient(v.x, v.y, 0, v.x, v.y, 12 * vg);
            rg.addColorStop(0,   `rgba(120, 160, 255, ${vg * 0.5})`);
            rg.addColorStop(0.4, `rgba(30,  80,  220, ${vg * 0.25})`);
            rg.addColorStop(1,   `rgba(10,  20,  140, 0)`);
            ctx.beginPath();
            ctx.arc(v.x, v.y, 12 * vg, 0, Math.PI * 2);
            ctx.fillStyle = rg;
            ctx.fill();
          }
        }
      }

      // Ambient blobs — softer and smaller
      ctx.save();
      ctx.globalCompositeOperation = 'screen';

      const b1 = ctx.createRadialGradient(h1x, h1y, 0, h1x, h1y, W * 0.28);
      b1.addColorStop(0,   `rgba(40, 120, 255, ${0.09 * pulse1})`);
      b1.addColorStop(0.4, `rgba(20, 60,  200, ${0.05 * pulse1})`);
      b1.addColorStop(1,   'rgba(0, 0, 0, 0)');
      ctx.beginPath();
      ctx.arc(h1x, h1y, W * 0.28, 0, Math.PI * 2);
      ctx.fillStyle = b1;
      ctx.fill();

      const b2 = ctx.createRadialGradient(h2x, h2y, 0, h2x, h2y, W * 0.32);
      b2.addColorStop(0,   `rgba(30, 60, 200, ${0.10 * pulse2})`);
      b2.addColorStop(0.4, `rgba(15, 30, 140, ${0.06 * pulse2})`);
      b2.addColorStop(1,   'rgba(0, 0, 0, 0)');
      ctx.beginPath();
      ctx.arc(h2x, h2y, W * 0.32, 0, Math.PI * 2);
      ctx.fillStyle = b2;
      ctx.fill();

      ctx.restore();

      animId = requestAnimationFrame(draw);
    }

    animId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animId);
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
        display: 'block',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}
