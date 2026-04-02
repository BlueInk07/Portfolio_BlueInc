import React, { useState, useRef, useEffect } from "react";
import "./TechStack.css";
import { useAnimationBudget } from "../hooks/usePerformanceProfile";
import gitIcon from "../assets/tech-icons/git-original.svg";
import githubIcon from "../assets/tech-icons/github-original.svg";
import figmaIcon from "../assets/tech-icons/figma-original.svg";
import canvaIcon from "../assets/tech-icons/canva-original.svg";
import pythonIcon from "../assets/tech-icons/python-original.svg";
import cppIcon from "../assets/tech-icons/cplusplus-original.svg";
import mysqlIcon from "../assets/tech-icons/mysql-original.svg";
import htmlIcon from "../assets/tech-icons/html5-original.svg";
import cssIcon from "../assets/tech-icons/css3-original.svg";
import jsIcon from "../assets/tech-icons/javascript-original.svg";
import reactIcon from "../assets/tech-icons/react-original.svg";
import mongoIcon from "../assets/tech-icons/mongodb-original.svg";
import expressIcon from "../assets/tech-icons/express-original.svg";

const TOOLS_NODE = {
  id: "tools", pos: "center", label: "TOOLS",
  color: "#0d0d0d", glow: "rgba(20,168,226,0.93)",
  techs: [
    { name: "Git",    icon: gitIcon },
    { name: "GitHub", icon: githubIcon },
    { name: "Figma",  icon: figmaIcon },
    { name: "Canva",  icon: canvaIcon },
  ],
};
const SATELLITE_NODES = [
  {
    id: "language", pos: "top", label: "LANGUAGE",
    color: "#0e0e0e", glow: "rgba(20,168,226,0.93)",
    techs: [
      { name: "Python", icon: pythonIcon },
      { name: "C++",    icon: cppIcon },
      { name: "SQL",    icon: mysqlIcon },
    ],
  },
  {
    id: "frontend", pos: "left", label: "FRONTEND",
    color: "#0c0c0c", glow: "rgba(20,168,226,0.93)",
    techs: [
      { name: "HTML5",      icon: htmlIcon },
      { name: "CSS3",       icon: cssIcon },
      { name: "JavaScript", icon: jsIcon },
      { name: "React",      icon: reactIcon },
    ],
  },
  {
    id: "database", pos: "right", label: "DATABASE",
    color: "#111111", glow: "rgba(20,168,226,0.93)",
    labelPosition: "bottom-right", // <-- bottom-right label
    techs: [
      { name: "MongoDB", icon: mongoIcon },
    ],
  },
  {
    id: "backend", pos: "bottom", label: "BACKEND",
    color: "#060113", glow: "rgba(20,168,226,0.93)",
    labelPosition: "bottom-right", // <-- bottom-right label
    techs: [
      { name: "Python",  icon: pythonIcon },
      { name: "Express", icon: expressIcon },
    ],
  },
];

const DOT_GAP    = 28;
const BASE_R     = 1.1;
const HOVER_RAD  = 240;
const BASE_ALPHA = 0.08;

// Smooth easing: sine in-out
function easeInOutSine(t) {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

// Each dot gets a unique phase offset for smooth independent breathing
function seedRandom(x, y) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

function DotCanvas({ W, H, isActive }) {
  const canvasRef = useRef(null);
  const mouseRef  = useRef({ x: -9999, y: -9999 });
  const rafRef    = useRef(null);
  const dotsRef   = useRef([]);
  const startRef  = useRef(null);
  const lastFrameRef = useRef(0);
  const { shouldAnimate, targetFps, isLowPowerDevice } = useAnimationBudget(isActive);
  const renderScale = isLowPowerDevice ? 0.5 : 0.68;

  useEffect(() => {
    const cols = Math.ceil(W / DOT_GAP) + 2;
    const rows = Math.ceil(H / DOT_GAP) + 2;
    const dots = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * DOT_GAP;
        const y = r * DOT_GAP;
        const rnd = seedRandom(c, r);
        // Each dot: unique breath period (4–10s), phase, and a depth layer (0..1)
        dots.push({
          x, y,
          phase:    rnd * Math.PI * 2,
          period:   4000 + rnd * 6000,
          depth:    0.3 + seedRandom(r, c) * 0.7,   // simulates z-depth
          breathAmp: 0.35 + seedRandom(c * 3, r * 7) * 0.65,
        });
      }
    }
    dotsRef.current = dots;
  }, [W, H]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !shouldAnimate) return undefined;
    const ctx = canvas.getContext("2d");
    canvas.width = Math.max(1, Math.floor(W * renderScale));
    canvas.height = Math.max(1, Math.floor(H * renderScale));
    ctx.setTransform(renderScale, 0, 0, renderScale, 0, 0);

    // Autonomous wander orbs — slower, smoother, larger influence radii
    const orbs = [
      { ax: 0.22, ay: 0.18, fx: 0.00009, fy: 0.00013, px: 0.00, py: 1.20, r: 260, str: 0.80 },
      { ax: 0.68, ay: 0.70, fx: 0.00007, fy: 0.00011, px: 2.50, py: 0.40, r: 300, str: 0.90 },
      { ax: 0.82, ay: 0.28, fx: 0.00011, fy: 0.00008, px: 4.80, py: 3.10, r: 220, str: 0.75 },
      { ax: 0.12, ay: 0.58, fx: 0.00006, fy: 0.00014, px: 1.60, py: 5.50, r: 240, str: 0.85 },
      { ax: 0.50, ay: 0.42, fx: 0.00010, fy: 0.00009, px: 3.20, py: 2.80, r: 200, str: 0.70 },
    ];

    const draw3DSphere = (ctx, x, y, r, energy, isMouse) => {
      // Outer atmospheric glow — very soft, large spread
      const atmR = r * 6.5;
      const atm = ctx.createRadialGradient(x, y, r * 0.8, x, y, atmR);
      const atmStr = energy * (isMouse ? 0.18 : 0.10);
      atm.addColorStop(0,   `rgba(60,140,255,${atmStr.toFixed(3)})`);
      atm.addColorStop(0.4, `rgba(30,90,220,${(atmStr * 0.4).toFixed(3)})`);
      atm.addColorStop(1,   `rgba(0,30,120,0)`);
      ctx.beginPath();
      ctx.arc(x, y, atmR, 0, Math.PI * 2);
      ctx.fillStyle = atm;
      ctx.fill();

      // Core sphere — 3D lit from top-left
      // Offset highlight center to simulate directional light
      const lx = x - r * 0.35;
      const ly = y - r * 0.40;
      const sphere = ctx.createRadialGradient(lx, ly, r * 0.02, x, y, r);
      const alpha  = Math.min(1, energy * 1.1);
      sphere.addColorStop(0,    `rgba(230,248,255,${(alpha * 0.95).toFixed(3)})`);
      sphere.addColorStop(0.25, `rgba(140,200,255,${(alpha * 0.90).toFixed(3)})`);
      sphere.addColorStop(0.55, `rgba(55,130,245,${(alpha * 0.82).toFixed(3)})`);
      sphere.addColorStop(0.80, `rgba(20,70,210,${(alpha * 0.70).toFixed(3)})`);
      sphere.addColorStop(1,    `rgba(5,30,160,${(alpha * 0.50).toFixed(3)})`);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = sphere;
      ctx.fill();

      // Specular highlight — tight bright spot, top-left
      if (energy > 0.18) {
        const sr  = r * 0.28;
        const spec = ctx.createRadialGradient(lx, ly, 0, lx, ly, sr);
        spec.addColorStop(0,   `rgba(255,255,255,${(energy * 0.85).toFixed(3)})`);
        spec.addColorStop(0.5, `rgba(200,235,255,${(energy * 0.30).toFixed(3)})`);
        spec.addColorStop(1,   `rgba(200,235,255,0)`);
        ctx.beginPath();
        ctx.arc(lx, ly, sr, 0, Math.PI * 2);
        ctx.fillStyle = spec;
        ctx.fill();
      }

      // Subtle rim light on bottom-right edge (gives sphere roundness)
      if (energy > 0.35) {
        const rx2 = x + r * 0.55;
        const ry2 = y + r * 0.50;
        const rim  = ctx.createRadialGradient(rx2, ry2, r * 0.3, rx2, ry2, r * 0.9);
        rim.addColorStop(0,   `rgba(80,160,255,${(energy * 0.22).toFixed(3)})`);
        rim.addColorStop(1,   `rgba(80,160,255,0)`);
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = rim;
        ctx.fill();
      }
    };

    const frameInterval = 1000 / targetFps;

    const draw = (ts) => {
      if (ts - lastFrameRef.current < frameInterval) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }
      lastFrameRef.current = ts;

      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;

      ctx.clearRect(0, 0, W, H);
      const { x: mx, y: my } = mouseRef.current;

      // Compute orb positions this frame
      const orbPos = orbs.map(o => ({
        x:   (o.ax + 0.16 * Math.sin(elapsed * o.fx + o.px)) * W,
        y:   (o.ay + 0.13 * Math.cos(elapsed * o.fy + o.py)) * H,
        r:   o.r,
        str: o.str,
      }));

      for (const dot of dotsRef.current) {
        const { x, y, phase, period, depth, breathAmp } = dot;

        // Smooth autonomous breath: sine wave, unique per dot
        const breathT  = easeInOutSine((Math.sin(elapsed / period * Math.PI * 2 + phase) + 1) / 2);
        const breathVal = breathT * breathAmp * depth; // deeper dots breathe more visibly

        // Mouse influence
        const dx   = x - mx, dy = y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const mProx = Math.max(0, 1 - dist / HOVER_RAD);
        // Smooth cubic falloff
        const mouseEnergy = mProx * mProx * mProx;

        // Orb influence — smooth quadratic falloff
        let orbEnergy = 0;
        for (const o of orbPos) {
          const gdx = x - o.x, gdy = y - o.y;
          const gd  = Math.sqrt(gdx * gdx + gdy * gdy);
          const gp  = Math.max(0, 1 - gd / o.r);
          const contrib = gp * gp * o.str;
          orbEnergy = Math.max(orbEnergy, contrib);
        }

        // Blend: mouse is king, orbs are secondary, breath adds base life
        const rawEnergy  = Math.max(mouseEnergy, orbEnergy * 0.90);
        // Breath modulates the ambient orb energy (not mouse — mouse is always crisp)
        const finalEnergy = mouseEnergy > 0.05
          ? mouseEnergy + breathVal * 0.12
          : rawEnergy * (0.55 + breathVal * 0.45);

        const isMouse = mouseEnergy > orbEnergy * 0.8;

        if (finalEnergy > 0.015) {
          // Radius scales with depth for parallax feel
          const maxR = 5.5 + depth * 2.0;
          const r    = BASE_R + finalEnergy * (maxR - BASE_R);
          draw3DSphere(ctx, x, y, r, finalEnergy, isMouse);
        } else {
          // Resting dot — very dim, depth-tinted
          const restAlpha = BASE_ALPHA * (0.5 + depth * 0.5);
          ctx.beginPath();
          ctx.arc(x, y, BASE_R, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(180,210,255,${restAlpha.toFixed(3)})`;
          ctx.fill();
        }
      }
      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [W, H, shouldAnimate, targetFps, renderScale]);

  useEffect(() => {
    const move  = e => {
      const r = canvasRef.current?.getBoundingClientRect();
      if (r) mouseRef.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const leave = () => { mouseRef.current = { x: -9999, y: -9999 }; };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseleave", leave);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseleave", leave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={W} height={H}
      style={{
        position: "absolute", inset: 0,
        width: "100%", height: "100%",
        zIndex: 1, pointerEvents: "none",
      }}
    />
  );
}

// ── Popup Modal ──────────────────────────────────────────────────────────────
function CardPopup({ cat, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div
        className="popup-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative corner accent */}
        <div className="popup-corner-tl" />
        <div className="popup-corner-br" />

        <button className="popup-close" onClick={onClose} aria-label="Close">✕</button>

        <div className="popup-header">
          <span className="popup-hash">#</span>
          <h2 className="popup-title">{cat.label}</h2>
        </div>

        <div className="popup-divider" />

        <div className="popup-techs">
          {cat.techs.map((tech) => (
            <div key={tech.name} className="popup-tech-item">
              <div className="popup-tech-icon">
                <img src={tech.icon} alt={tech.name} loading="lazy" decoding="async" />
              </div>
              <span className="popup-tech-name">{tech.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function TechStack({ isActive = true }) {
  const ref = useRef(null);
  const [size, setSize] = useState({ W: 900, H: 700 });
  const [isOpen, setIsOpen] = useState(false);
  const [activeCard, setActiveCard] = useState(null);

  useEffect(() => {
    const obs = new ResizeObserver(([e]) => {
      setSize({ W: e.contentRect.width, H: e.contentRect.height });
    });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const allCategories = [TOOLS_NODE, ...SATELLITE_NODES];

  const handleCardClick = (e, cat) => {
    e.stopPropagation();   // don't toggle the envelope
    setActiveCard(cat);
  };

  return (
    <div className="ts-wrapper" ref={ref}>
      <DotCanvas W={size.W} H={size.H} isActive={isActive} />

      {/* Background ambient blobs */}
      <div className="ts-blob" style={{ width: 500, height: 500, top: -160, left: -160, background: "rgba(0, 102, 255, 0.08)" }} />
      <div className="ts-blob" style={{ width: 420, height: 420, bottom: -110, right: -100, background: "rgba(2, 59, 112, 0.15)" }} />
      <div className="ts-blob" style={{ width: 360, height: 360, top: "28%", left: "40%", background: "rgba(73, 146, 255, 0.05)" }} />

      <div className="ts-header-box">
        <div className="ts-header-top">
          <div className="ts-tech-word">
            <span style={{ color: "#b3d4ff" }}>T</span><span style={{ color: "#80b6ff" }}>E</span>
            <span style={{ color: "#4d95ff" }}>C</span><span style={{ color: "#1a7aff" }}>H</span>
          </div>
          <div className="ts-barcode">
            {[4, 2, 6, 2, 4, 3, 2, 5, 2, 4, 2, 6, 3, 2, 4].map((w, i) => <div key={i} className="ts-bar" style={{ width: `${w}px` }} />)}
          </div>
        </div>
        <div className="ts-header-bottom">
          <div className="ts-colored-blocks">
            <div className="ts-c-block dark" /><div className="ts-c-block mid" /><div className="ts-c-block light" />
          </div>
          <div className="ts-stack-word">STACK</div>
        </div>
      </div>

      <div className="env-scene">
        <div className={`env-wrapper ${isOpen ? "open" : ""}`} onClick={() => setIsOpen(!isOpen)}>

          <div className="env-back"></div>

          <div className="env-cards">
            {allCategories.map((cat, i) => (
              <div
                key={cat.id}
                className={`env-card env-card-${i}`}
                onClick={(e) => handleCardClick(e, cat)}
                title={`View ${cat.label}`}
              >
                {/* Label: bottom-right for database/backend, top-left for others */}
                <div className={`env-card-label ${cat.labelPosition === "bottom-right" ? "label-bottom-right" : ""}`}>
                  #{cat.label}
                </div>

                <div className="env-card-techs">
                  {cat.techs.map((tech) => (
                    <div key={tech.name} className="env-tech-item">
                      <div className="env-tech-icon">
                        <img src={tech.icon} alt={tech.name} loading="lazy" decoding="async" />
                      </div>
                      <span className="env-tech-name">{tech.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="env-front"></div>
          <div className="env-pocket-shadow"></div>
          <div className="env-click-hint">{isOpen ? "CLICK TO CLOSE" : "CLICK TO EXPAND"}</div>
        </div>
      </div>

      {/* Popup Modal */}
      {activeCard && (
        <CardPopup cat={activeCard} onClose={() => setActiveCard(null)} />
      )}
    </div>
  );
}
