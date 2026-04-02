import React, { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import HexBackground from '../components/HexBackground';
import creatorImg from '../assets/Creator.jpeg';
import './Cubes.css';
import './AboutMe.css';

/* ─── Cubes Component ──────────────────────────────────────────── */
const Cubes = ({
  rows = 5, cols = 5, maxAngle = 45, radius = 3,
  easing = 'power3.out', duration = { enter: 0.3, leave: 0.6 },
  cellGap, borderStyle = '1px solid #fff', faceColor = '#060010',
  autoAnimate = true, rippleOnClick = true,
  rippleColor = '#fff', rippleSpeed = 2, isActive = true
}) => {
  const sceneRef = useRef(null);
  const rafRef = useRef(null);
  const idleTimerRef = useRef(null);
  const userActiveRef = useRef(false);
  const simPosRef = useRef({ x: 0, y: 0 });
  const simTargetRef = useRef({ x: 0, y: 0 });
  const simRAFRef = useRef(null);

  const colGap = typeof cellGap === 'number' ? `${cellGap}px` : cellGap?.col !== undefined ? `${cellGap.col}px` : '5%';
  const rowGap = typeof cellGap === 'number' ? `${cellGap}px` : cellGap?.row !== undefined ? `${cellGap.row}px` : '5%';
  const enterDur = duration.enter;
  const leaveDur = duration.leave;

  const tiltAt = useCallback((rowCenter, colCenter) => {
    if (!sceneRef.current) return;
    sceneRef.current.querySelectorAll('.cube').forEach(cube => {
      const r = +cube.dataset.row;
      const c = +cube.dataset.col;
      const dist = Math.hypot(r - rowCenter, c - colCenter);
      if (dist <= radius) {
        const pct = 1 - dist / radius;
        gsap.to(cube, { duration: enterDur, ease: easing, overwrite: true, rotateX: -(pct * maxAngle), rotateY: pct * maxAngle });
      } else {
        gsap.to(cube, { duration: leaveDur, ease: 'power3.out', overwrite: true, rotateX: 0, rotateY: 0 });
      }
    });
  }, [radius, maxAngle, enterDur, leaveDur, easing]);

  const onPointerMove = useCallback(e => {
    userActiveRef.current = true;
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    const rect = sceneRef.current.getBoundingClientRect();
    const colCenter = (e.clientX - rect.left) / (rect.width / cols);
    const rowCenter = (e.clientY - rect.top) / (rect.height / rows);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => tiltAt(rowCenter, colCenter));
    idleTimerRef.current = setTimeout(() => { userActiveRef.current = false; }, 3000);
  }, [cols, rows, tiltAt]);

  const resetAll = useCallback(() => {
    if (!sceneRef.current) return;
    sceneRef.current.querySelectorAll('.cube').forEach(cube =>
      gsap.to(cube, { duration: leaveDur, rotateX: 0, rotateY: 0, ease: 'power3.out' })
    );
  }, [leaveDur]);

  const onClick = useCallback(e => {
    if (!rippleOnClick || !sceneRef.current) return;
    const rect = sceneRef.current.getBoundingClientRect();
    const cellW = rect.width / cols;
    const cellH = rect.height / rows;
    const colHit = Math.floor((e.clientX - rect.left) / cellW);
    const rowHit = Math.floor((e.clientY - rect.top) / cellH);
    const spreadDelay = (0.15 / rippleSpeed);
    const animDuration = (0.3 / rippleSpeed);
    const holdTime = (0.6 / rippleSpeed);
    const rings = {};
    sceneRef.current.querySelectorAll('.cube').forEach(cube => {
      const ring = Math.round(Math.hypot(+cube.dataset.row - rowHit, +cube.dataset.col - colHit));
      if (!rings[ring]) rings[ring] = [];
      rings[ring].push(cube);
    });
    Object.keys(rings).map(Number).sort((a, b) => a - b).forEach(ring => {
      const delay = ring * spreadDelay;
      const faces = rings[ring].flatMap(cube => Array.from(cube.querySelectorAll('.cube-face')));
      gsap.to(faces, { backgroundColor: rippleColor, duration: animDuration, delay, ease: 'power3.out' });
      gsap.to(faces, { backgroundColor: faceColor, duration: animDuration, delay: delay + animDuration + holdTime, ease: 'power3.out' });
    });
  }, [rippleOnClick, cols, rows, faceColor, rippleColor, rippleSpeed]);

  useEffect(() => {
    if (!autoAnimate || !isActive || !sceneRef.current) return;
    simPosRef.current = { x: Math.random() * cols, y: Math.random() * rows };
    simTargetRef.current = { x: Math.random() * cols, y: Math.random() * rows };
    const loop = () => {
      if (!userActiveRef.current) {
        const pos = simPosRef.current, tgt = simTargetRef.current;
        pos.x += (tgt.x - pos.x) * 0.02;
        pos.y += (tgt.y - pos.y) * 0.02;
        tiltAt(pos.y, pos.x);
        if (Math.hypot(pos.x - tgt.x, pos.y - tgt.y) < 0.1)
          simTargetRef.current = { x: Math.random() * cols, y: Math.random() * rows };
      }
      simRAFRef.current = requestAnimationFrame(loop);
    };
    simRAFRef.current = requestAnimationFrame(loop);
    return () => { if (simRAFRef.current != null) cancelAnimationFrame(simRAFRef.current); };
  }, [autoAnimate, cols, rows, tiltAt, isActive]);

  useEffect(() => {
    const el = sceneRef.current;
    if (!el) return;
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerleave', resetAll);
    el.addEventListener('click', onClick);
    return () => {
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerleave', resetAll);
      el.removeEventListener('click', onClick);
      rafRef.current != null && cancelAnimationFrame(rafRef.current);
      idleTimerRef.current && clearTimeout(idleTimerRef.current);
    };
  }, [onPointerMove, resetAll, onClick]);

  const rowArray = Array.from({ length: rows });
  const colArray = Array.from({ length: cols });

  return (
    <div className="default-animation" style={{ '--cube-face-border': borderStyle, '--cube-face-bg': faceColor }}>
      <div ref={sceneRef} className="default-animation--scene"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)`, columnGap: colGap, rowGap: rowGap }}>
        {rowArray.map((_, r) => colArray.map((__, c) => (
          <div key={`${r}-${c}`} className="cube" data-row={r} data-col={c}>
            <div className="cube-face cube-face--top" />
            <div className="cube-face cube-face--bottom" />
            <div className="cube-face cube-face--left" />
            <div className="cube-face cube-face--right" />
            <div className="cube-face cube-face--front" />
            <div className="cube-face cube-face--back" />
          </div>
        )))}
      </div>
    </div>
  );
};

/* ─── B&W SVG Icons ───────────────────────────────────────────── */
const IconLinkedIn = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const IconGitHub = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
  </svg>
);

const IconFigma = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
    <path d="M15.852 8.981h-4.588V0h4.588c2.476 0 4.49 2.014 4.49 4.49s-2.014 4.491-4.49 4.491zM12.735 7.51h3.117c1.665 0 3.019-1.355 3.019-3.019s-1.354-3.019-3.019-3.019h-3.117V7.51zm0 1.471H8.148c-2.476 0-4.49-2.014-4.49-4.49S5.672 0 8.148 0h4.588v8.981zm-4.587-7.51c-1.665 0-3.019 1.355-3.019 3.019s1.354 3.019 3.019 3.019h3.117V1.471H8.148zm4.587 15.019H8.148c-2.476 0-4.49-2.014-4.49-4.49s2.014-4.49 4.49-4.49h4.588v8.98zM8.148 8.981c-1.665 0-3.019 1.355-3.019 3.019s1.354 3.019 3.019 3.019h3.117V8.981H8.148zm7.704 0h-3.117v8.98h3.117c2.476 0 4.49-2.014 4.49-4.49s-2.014-4.49-4.49-4.49zm0 7.509h-1.646v-6.038h1.646c1.665 0 3.019 1.355 3.019 3.019s-1.354 3.019-3.019 3.019zM4.49 24c-2.476 0-4.49-2.014-4.49-4.49s2.014-4.49 4.49-4.49h4.588V24H4.49zm0-7.509c-1.665 0-3.019 1.355-3.019 3.019S2.825 22.529 4.49 22.529h3.117v-6.038H4.49z"/>
  </svg>
);

/* ─── HELLO Target ────────────────────────────────────────────── */
const HelloTarget = ({ onTarget }) => {
  const [targeted, setTargeted] = useState(false);

  const handleEnter = () => { setTargeted(true); onTarget(true); };
  const handleLeave = () => { setTargeted(false); onTarget(false); };

  return (
    <div className="hello-wrapper" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      <div className={`hello-container ${targeted ? 'targeted' : ''}`}>
        <div className="target-corner tl-c" />
        <div className="target-corner tr" />
        <div className="target-corner bl" />
        <div className="target-corner br" />
        <div className="target-dot" />
        <h1 className="hello-text">HELLO!</h1>
      </div>
      <p className="hello-sub">Try Targetting<br/>hello!</p>
    </div>
  );
};

/* ─── Moodboard single image ─────────────────────────────────── */
const Moodboard = () => (
  <div className="mb-single-image">
    <img
      src={creatorImg}
      alt="Creator"
      loading="lazy"
      decoding="async"
    />
  </div>
);

/* ─── Timeline ───────────────────────────────────────────────── */
const Timeline = () => (
  <div className="timeline-card bento-tile">
    <span className="tl-title">Current Status</span>
    <div className="tl-tree">
      <div className="tl-top-dot" />
      <div className="tl-line-v tl-line-v-long" />
      <div className="tl-branch-area">
        <div className="tl-branch">
          <div className="tl-branch-tooltip">5+</div>
          <div className="tl-branch-line" />
          <div className="tl-dot" />
          <span className="tl-label">Projects<br/>Built</span>
        </div>
        <div className="tl-branch">
          <div className="tl-branch-tooltip">14+</div>
          <div className="tl-branch-line" />
          <div className="tl-dot" />
          <span className="tl-label">Tech<br/>Stack</span>
        </div>
      </div>
      <div className="tl-line-v tl-line-v-long" />
      <div className="tl-bottom-circle">↓</div>
    </div>
    <a href="/src/assets/resume.pdf" download="Simran_Resume.pdf" className="resume-btn">
      Download Resume
    </a>
  </div>
);

/* ─── Expandable Tiles ───────────────────────────────────────── */
const EducationTile = () => (
  <div className="bento-tile edu-tile">
    <div className="tile-default">EDUCATION</div>
    <div className="tile-expanded-content">
      <div className="tile-header">
        <span className="tile-title">EDUCATION</span>
        <span className="tile-year">2024–2028</span>
      </div>
      <p>CSE (AI &amp; ML)<br/>undergraduate at<br/>Chandigarh University.</p>
    </div>
  </div>
);

const ExperienceTile = () => (
  <div className="bento-tile exp-tile">
    <div className="tile-default">EXPERIENCE</div>
    <div className="tile-expanded-content">
      <div className="tile-header">
        <span className="tile-title">EXPERIENCE</span>
      </div>
      <p>CodeChef Community<br/>Core Team Member</p>
    </div>
  </div>
);

const SocialTile = () => (
  <div className="bento-tile social-tile">
    <div className="tile-default">SOCIAL HANDLES</div>
    <div className="tile-expanded-content">
      <span className="tile-title" style={{ marginBottom: '6px' }}>SOCIAL HANDLES</span>
      <div className="social-links-col">
        <a href="https://www.linkedin.com/in/simran-chouhan17" className="social-link" target="_blank" rel="noreferrer">
          <IconLinkedIn /> LinkedIn
        </a>
        <a href="https://github.com/BlueInk07" className="social-link" target="_blank" rel="noreferrer">
          <IconGitHub /> GitHub
        </a>
        <a href="https://www.figma.com/@simran_17" className="social-link" target="_blank" rel="noreferrer">
          <IconFigma /> Figma
        </a>
      </div>
    </div>
  </div>
);

const LanguageTile = () => (
  <div className="bento-tile lang-tile">
    <div className="tile-default">LANGUAGE</div>
    <div className="tile-expanded-content">
      <span className="tile-title" style={{ marginBottom: '4px' }}>LANGUAGE</span>
      <div className="lang-list">
        <p>English</p>
        <p>한글</p>
        <p>हिन्दी</p>
      </div>
    </div>
  </div>
);

/* ─── Main AboutMe Page ──────────────────────────────────────── */
export default function AboutMe({ isActive = true }) {
  const [targeted, setTargeted] = useState(false);

  return (
    <div className="about-page">
      {/* Animated hexagonal background — replaces static stars-bg */}
      <HexBackground isActive={isActive} />

      <h2 className="page-title">ABOUT<br/><span className="dot-me">.ME.</span></h2>

      <div className="main-layout">
        {/* Top Section */}
        <div className="top-section">
          <div className="vert-tiles-row">
            <div className="vert-tiles">
              <EducationTile />
              <ExperienceTile />
            </div>

            <div className="cubes-top">
              <Cubes rows={5} cols={2} radius={2}
                borderStyle="1px solid rgba(255,255,255,0.5)"
                faceColor="#020818" rippleColor="#ffffff"
                autoAnimate rippleOnClick isActive={isActive} />
            </div>
          </div>

          <div className="hello-section">
            <HelloTarget onTarget={setTargeted} />
            <div className="contact-area">
              <div className={`contact-pills ${targeted ? 'visible' : ''}`}>
                <span className="pill name-pill">Simran</span>
                <span className="pill phone-pill">7339574616</span>
              </div>
              <div className={`email-line ${targeted ? 'visible' : ''}`}>
                <span className="email-inline-badge">Simuchouhan17@gmail.com</span>
              </div>
            </div>
          </div>

          <div className="moodboard-section">
            <Moodboard />
          </div>
        </div>

        {/* Bottom Section */}
        <div className="bottom-section">
          <div className="status-timeline">
            <Timeline />
          </div>

          <div className="bottom-interactive">
            <div className="lang-social-wrapper">
              <LanguageTile />
              <SocialTile />
            </div>

            <div className="cubes-bottom">
              <Cubes rows={5} cols={6} radius={2}
                borderStyle="1px solid rgba(255,255,255,0.5)"
                faceColor="#020818" rippleColor="#ffffff"
                autoAnimate rippleOnClick isActive={isActive} />
            </div>
          </div>
        </div>

        {/* Mobile-only bottom cubes (6x6) */}
        <div className="mobile-cubes-bottom">
          <Cubes rows={6} cols={6} radius={2}
            borderStyle="1px solid rgba(255,255,255,0.5)"
            faceColor="#020818" rippleColor="#ffffff"
            autoAnimate rippleOnClick isActive={isActive} />
        </div>
      </div>
    </div>
  );
}
