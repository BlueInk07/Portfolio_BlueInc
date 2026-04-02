import { useEffect, useRef } from 'react';
import { useAnimationBudget } from '../hooks/usePerformanceProfile';

const NeuralCircuit = ({ isActive = true }) => {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);
  const mouseRef  = useRef({ x: 0.5, y: 0.5 });
  const lastFrameRef = useRef(0);
  const { shouldAnimate, targetFps } = useAnimationBudget(isActive);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !shouldAnimate) return undefined;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const onMouse = e => {
      const r = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: (e.clientX - r.left) / r.width,
        y: (e.clientY - r.top)  / r.height,
      };
    };
    window.addEventListener('mousemove', onMouse);

    // ── 3D nodes in a cloud formation ─────────────────────────
    const NODE_COUNT = 55;
    const nodes = Array.from({ length: NODE_COUNT }, (_, i) => ({
      // Spread across 3D space  (-1 to 1 range, Z gives depth)
      x:  (Math.random() - 0.5) * 1.6,
      y:  (Math.random() - 0.5) * 1.2,
      z:  (Math.random() - 0.5) * 1.4,
      vx: (Math.random() - 0.5) * 0.00025,
      vy: (Math.random() - 0.5) * 0.00018,
      vz: (Math.random() - 0.5) * 0.00020,
      size:    Math.random() * 2.5 + 1.0,
      pulse:   Math.random() * Math.PI * 2,
      // Some nodes are "hub" nodes — bigger, brighter
      isHub:   i < 8,
    }));

    // Pre-compute stable edge pairs (connect nearby nodes)
    const edges = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dz = nodes[i].z - nodes[j].z;
        const d  = Math.sqrt(dx*dx + dy*dy + dz*dz);
        if (d < 0.55) edges.push({ a: i, b: j, baseDist: d });
      }
    }

    // ── Travelling pulses along edges ─────────────────────────
    const pulses = [];
    const spawnPulse = () => {
      if (edges.length === 0) return;
      const edge = edges[Math.floor(Math.random() * edges.length)];
      pulses.push({ edge, t: 0, speed: 0.004 + Math.random() * 0.004 });
    };
    for (let i = 0; i < 18; i++) spawnPulse();

    // ── Floating ring orbs ────────────────────────────────────
    const orbs = Array.from({ length: 4 }, (_, i) => ({
      x:  (Math.random() - 0.5) * 1.2,
      y:  (Math.random() - 0.5) * 0.8,
      z:  (Math.random() - 0.5) * 1.0,
      r:  0.06 + Math.random() * 0.06,
      vx: (Math.random() - 0.5) * 0.00012,
      vy: (Math.random() - 0.5) * 0.00010,
      vz: (Math.random() - 0.5) * 0.00015,
      phase: Math.random() * Math.PI * 2,
    }));

    let t = 0;
    const FOV = 1.8;

    // Project 3D → 2D with mouse parallax tilt
    const project = (nx, ny, nz, W, H) => {
      const mx = (mouseRef.current.x - 0.5) * 0.25;
      const my = (mouseRef.current.y - 0.5) * 0.18;
      // Gentle parallax rotation
      const rx = nx * Math.cos(my) - nz * Math.sin(my);
      const ry = ny + nx * Math.sin(mx) * 0.1;
      const rz = nz * Math.cos(my) + nx * Math.sin(my) + FOV;
      const scale = FOV / Math.max(rz, 0.1);
      return {
        sx:    W * 0.5 + rx * scale * W * 0.38,
        sy:    H * 0.5 + ry * scale * H * 0.38,
        scale,
        depth: rz,
      };
    };

    const frameInterval = 1000 / targetFps;

    const draw = (timestamp = 0) => {
      if (timestamp - lastFrameRef.current < frameInterval) {
        animRef.current = requestAnimationFrame(draw);
        return;
      }
      lastFrameRef.current = timestamp;

      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      // Move nodes
      nodes.forEach(n => {
        n.x  += n.vx; n.y  += n.vy; n.z  += n.vz;
        n.pulse += 0.018;
        if (Math.abs(n.x) > 0.9) n.vx *= -1;
        if (Math.abs(n.y) > 0.7) n.vy *= -1;
        if (Math.abs(n.z) > 0.8) n.vz *= -1;
      });

      // Move orbs
      orbs.forEach(o => {
        o.x += o.vx; o.y += o.vy; o.z += o.vz;
        o.phase += 0.012;
        if (Math.abs(o.x) > 0.7) o.vx *= -1;
        if (Math.abs(o.y) > 0.6) o.vy *= -1;
        if (Math.abs(o.z) > 0.6) o.vz *= -1;
      });

      // Advance pulses
      for (let i = pulses.length - 1; i >= 0; i--) {
        pulses[i].t += pulses[i].speed;
        if (pulses[i].t >= 1) {
          pulses.splice(i, 1);
          spawnPulse();
        }
      }

      // Project all nodes
      const proj = nodes.map(n => project(n.x, n.y, n.z, W, H));

      // ── Draw edges (depth sorted, back to front) ───────────
      const sortedEdges = edges
        .map(e => ({ ...e, avgZ: proj[e.a].depth + proj[e.b].depth }))
        .sort((a, b) => b.avgZ - a.avgZ);

      sortedEdges.forEach(({ a, b, avgZ }) => {
        const pa = proj[a], pb = proj[b];
        const depthFade = Math.max(0, Math.min(1, 1.4 - avgZ * 0.38));
        const alpha = depthFade * 0.18;
        if (alpha < 0.02) return;

        ctx.beginPath();
        ctx.moveTo(pa.sx, pa.sy);
        ctx.lineTo(pb.sx, pb.sy);
        ctx.strokeStyle = `rgba(30, 90, 255, ${alpha})`;
        ctx.lineWidth   = 0.6;
        ctx.stroke();
      });

      // ── Draw travelling pulses ────────────────────────────
      pulses.forEach(({ edge, t: pt }) => {
        const pa = proj[edge.a], pb = proj[edge.b];
        const px = pa.sx + (pb.sx - pa.sx) * pt;
        const py = pa.sy + (pb.sy - pa.sy) * pt;
        const pDepth = pa.depth + (pb.depth - pa.depth) * pt;
        const pScale = Math.max(0, 1.2 - pDepth * 0.3);

        // Glow trail
        const trail = ctx.createRadialGradient(px, py, 0, px, py, 8 * pScale);
        trail.addColorStop(0,   `rgba(80, 160, 255, ${0.7 * pScale})`);
        trail.addColorStop(0.4, `rgba(40, 100, 255, ${0.3 * pScale})`);
        trail.addColorStop(1,   'rgba(20, 60, 200, 0)');
        ctx.beginPath();
        ctx.arc(px, py, 8 * pScale, 0, Math.PI * 2);
        ctx.fillStyle = trail;
        ctx.fill();

        // Bright dot
        ctx.beginPath();
        ctx.arc(px, py, 2 * pScale, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(160, 210, 255, ${0.9 * pScale})`;
        ctx.fill();
      });

      // ── Draw nodes (back to front) ────────────────────────
      const sortedNodes = nodes
        .map((n, i) => ({ n, p: proj[i] }))
        .sort((a, b) => b.p.depth - a.p.depth);

      sortedNodes.forEach(({ n, p }) => {
        const depthFade = Math.max(0, Math.min(1, 1.5 - p.depth * 0.35));
        const pulseFactor = 0.85 + Math.sin(n.pulse) * 0.15;
        const r = (n.isHub ? 5 : n.size) * p.scale * pulseFactor * depthFade;
        if (r < 0.3) return;

        const alpha = depthFade * (n.isHub ? 0.9 : 0.65);

        // Outer glow on hub nodes
        if (n.isHub) {
          const glow = ctx.createRadialGradient(p.sx, p.sy, 0, p.sx, p.sy, r * 5);
          glow.addColorStop(0,   `rgba(50, 130, 255, ${alpha * 0.4})`);
          glow.addColorStop(0.5, `rgba(20,  80, 220, ${alpha * 0.15})`);
          glow.addColorStop(1,   'rgba(10, 40, 180, 0)');
          ctx.beginPath();
          ctx.arc(p.sx, p.sy, r * 5, 0, Math.PI * 2);
          ctx.fillStyle = glow;
          ctx.fill();
        }

        // Node core
        const grad = ctx.createRadialGradient(p.sx, p.sy, 0, p.sx, p.sy, r);
        grad.addColorStop(0,   `rgba(160, 210, 255, ${alpha})`);
        grad.addColorStop(0.5, `rgba(60,  130, 255, ${alpha * 0.8})`);
        grad.addColorStop(1,   `rgba(20,   70, 200, 0)`);
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      });

      // ── Draw orbs — wireframe rings ───────────────────────
      orbs.forEach(o => {
        const p = project(o.x, o.y, o.z, W, H);
        const depthFade = Math.max(0, 1.2 - p.depth * 0.3);
        const rPx = o.r * p.scale * W * 0.38;
        const pulse = 0.9 + Math.sin(o.phase) * 0.1;

        ctx.beginPath();
        ctx.arc(p.sx, p.sy, rPx * pulse, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(50, 120, 255, ${depthFade * 0.35})`;
        ctx.lineWidth   = 1.2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(p.sx, p.sy, rPx * pulse * 0.6, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(100, 180, 255, ${depthFade * 0.25})`;
        ctx.lineWidth   = 0.7;
        ctx.stroke();
      });

      t++;
      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouse);
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

export default NeuralCircuit;
