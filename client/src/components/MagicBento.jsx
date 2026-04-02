import { useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import './MagicBento.css';
import twintalkImg from '../assets/twintalk.png';
import bloomeatsImg from '../assets/bloomeats.png';
import darkbytezImg from '../assets/darkbytez.png';
import syncinImg from '../assets/syncin.png';
import { useAnimationBudget } from '../hooks/usePerformanceProfile';

const DEFAULT_PARTICLE_COUNT = 12;
const DEFAULT_SPOTLIGHT_RADIUS = 300;
const DEFAULT_GLOW_COLOR = '29, 54, 182';
const MOBILE_BREAKPOINT = 768;

const cardData = [
  {
    title: 'TWINTALK',
    tagline: 'AI Conversational Bot',
    description: 'AI-powered chatbot with tone control and personalized responses trained on user chat history.',
    tech: 'HTML • CSS • JavaScript • Python',
    img: twintalkImg,
    link: 'https://github.com/yourusername/twintalk'
  },
  {
    title: 'BLOOMEATS',
    tagline: 'Food Delivery Web App',
    description: 'Multi-page food delivery interface with responsive layout and dynamic UI components.',
    tech: 'HTML • CSS • JavaScript • Python',
    img: bloomeatsImg,
    link: 'https://blueink07.github.io/BloomEats/'
  },
  {
    title: 'DARKBYTEZ',
    tagline: 'AI Voice-Based Redirector',
    description: 'Hands-free website navigation using voice commands and AI-based intent recognition.',
    tech: 'HTML • CSS • JavaScript • Python',
    img: darkbytezImg,
    link: 'https://github.com/yourusername/darkbytez'
  },
  {
    title: 'SYNCIN',
    tagline: 'Web Music Player',
    description: 'Browser-based music player with playlists, playback controls and responsive UI.',
    tech: 'HTML • CSS • JavaScript • Python',
    img: syncinImg,
    link: 'https://blueink07.github.io/Syncin/'
  }
];

const calculateSpotlightValues = (radius) => ({
  proximity: radius * 0.5,
  fadeDistance: radius * 0.75
});

const createParticleElement = (x, y, color = DEFAULT_GLOW_COLOR) => {
  const el = document.createElement('div');
  el.className = 'particle';
  el.style.cssText = `
    position: absolute;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: rgba(${color}, 1);
    box-shadow: 0 0 6px rgba(${color}, 0.6);
    pointer-events: none;
    z-index: 100;
    left: ${x}px;
    top: ${y}px;
  `;
  return el;
};

const updateCardGlowProperties = (card, rect, mouseX, mouseY, glow, radius) => {
  const relativeX = ((mouseX - rect.left) / rect.width) * 100;
  const relativeY = ((mouseY - rect.top) / rect.height) * 100;
  card.style.setProperty('--glow-x', `${relativeX}%`);
  card.style.setProperty('--glow-y', `${relativeY}%`);
  card.style.setProperty('--glow-intensity', glow.toString());
  card.style.setProperty('--glow-radius', `${radius}px`);
};

const CardContent = ({ card }) => (
  <>
    <div
      className="project-link-btn"
      onClick={(event) => {
        event.stopPropagation();
        window.open(card.link, '_blank');
      }}
    >
      🔗
    </div>

    <div className="magic-bento-card__bg">
      <img src={card.img} alt={card.title} loading="lazy" decoding="async" draggable={false} />
    </div>

    <div className="magic-bento-card__content-wrapper">
      <h2 className="magic-bento-card__title">{card.title}</h2>
      <div className="magic-bento-card__tagline">{card.tagline}</div>

      <div className="magic-bento-card__hover-content">
        <div className="magic-bento-card__label">Description</div>
        <p className="magic-bento-card__description">{card.description}</p>

        <div className="magic-bento-card__tech-stack">
          <span>TECH STACK: </span>
          {card.tech}
        </div>
      </div>
    </div>
  </>
);

const ParticleCard = ({
  children,
  className = '',
  disableAnimations = false,
  style,
  particleCount = DEFAULT_PARTICLE_COUNT,
  glowColor = DEFAULT_GLOW_COLOR,
  enableTilt = true,
  clickEffect = false,
  enableMagnetism = false,
  isInteractive = true
}) => {
  const cardRef = useRef(null);
  const particlesRef = useRef([]);
  const timeoutsRef = useRef([]);
  const memoizedParticles = useRef([]);
  const particlesInitialized = useRef(false);
  const isHoveredRef = useRef(false);
  const pointerFrameRef = useRef(null);
  const pointerStateRef = useRef({ rotateX: 0, rotateY: 0, magnetX: 0, magnetY: 0 });

  const initializeParticles = useCallback(() => {
    if (particlesInitialized.current || !cardRef.current) return;
    const { width, height } = cardRef.current.getBoundingClientRect();
    memoizedParticles.current = Array.from({ length: particleCount }, () =>
      createParticleElement(Math.random() * width, Math.random() * height, glowColor)
    );
    particlesInitialized.current = true;
  }, [particleCount, glowColor]);

  const clearAllParticles = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    particlesRef.current.forEach((particle) => {
      gsap.to(particle, {
        scale: 0,
        opacity: 0,
        duration: 0.3,
        ease: 'back.in(1.7)',
        onComplete: () => particle.parentNode?.removeChild(particle)
      });
    });
    particlesRef.current = [];
  }, []);

  const animateParticles = useCallback(() => {
    if (!cardRef.current || !isHoveredRef.current) return;
    if (!particlesInitialized.current) {
      initializeParticles();
    }

    memoizedParticles.current.forEach((particle, index) => {
      const timeoutId = setTimeout(() => {
        if (!isHoveredRef.current || !cardRef.current) return;
        const clone = particle.cloneNode(true);
        cardRef.current.appendChild(clone);
        particlesRef.current.push(clone);

        gsap.fromTo(clone, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' });
        gsap.to(clone, {
          x: (Math.random() - 0.5) * 100,
          y: (Math.random() - 0.5) * 100,
          rotation: Math.random() * 360,
          duration: 2 + Math.random() * 2,
          ease: 'none',
          repeat: -1,
          yoyo: true
        });
        gsap.to(clone, {
          opacity: 0.3,
          duration: 1.5,
          ease: 'power2.inOut',
          repeat: -1,
          yoyo: true
        });
      }, index * 100);

      timeoutsRef.current.push(timeoutId);
    });
  }, [initializeParticles]);

  useEffect(() => {
    if (disableAnimations || !isInteractive || !cardRef.current) return undefined;

    const element = cardRef.current;

    const handleMouseEnter = () => {
      isHoveredRef.current = true;
      animateParticles();
      if (enableTilt) {
        element.style.transform = 'perspective(1000px) rotateX(5deg) rotateY(5deg) translate3d(0, 0, 0)';
      }
    };

    const handleMouseLeave = () => {
      isHoveredRef.current = false;
      clearAllParticles();
      element.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translate3d(0, 0, 0)';
    };

    const handleMouseMove = (event) => {
      if (!enableTilt && !enableMagnetism) return;

      const rect = element.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      pointerStateRef.current = {
        rotateX: enableTilt ? ((y - centerY) / centerY) * -10 : 0,
        rotateY: enableTilt ? ((x - centerX) / centerX) * 10 : 0,
        magnetX: enableMagnetism ? (x - centerX) * 0.05 : 0,
        magnetY: enableMagnetism ? (y - centerY) * 0.05 : 0,
      };

      if (!pointerFrameRef.current) {
        pointerFrameRef.current = requestAnimationFrame(() => {
          pointerFrameRef.current = null;
          const { rotateX, rotateY, magnetX, magnetY } = pointerStateRef.current;
          element.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translate3d(${magnetX}px, ${magnetY}px, 0)`;
        });
      }
    };

    const handleClick = (event) => {
      if (!clickEffect) return;

      const rect = element.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const maxDistance = Math.max(
        Math.hypot(x, y),
        Math.hypot(x - rect.width, y),
        Math.hypot(x, y - rect.height),
        Math.hypot(x - rect.width, y - rect.height)
      );

      const ripple = document.createElement('div');
      ripple.style.cssText = `
        position: absolute;
        width: ${maxDistance * 2}px;
        height: ${maxDistance * 2}px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(${glowColor}, 0.4) 0%, rgba(${glowColor}, 0.2) 30%, transparent 70%);
        left: ${x - maxDistance}px;
        top: ${y - maxDistance}px;
        pointer-events: none;
        z-index: 1000;
      `;

      element.appendChild(ripple);
      gsap.fromTo(
        ripple,
        { scale: 0, opacity: 1 },
        { scale: 1, opacity: 0, duration: 0.8, ease: 'power2.out', onComplete: () => ripple.remove() }
      );
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);
    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('click', handleClick);

    return () => {
      isHoveredRef.current = false;
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('click', handleClick);
      if (pointerFrameRef.current) {
        cancelAnimationFrame(pointerFrameRef.current);
      }
      clearAllParticles();
    };
  }, [animateParticles, clearAllParticles, clickEffect, disableAnimations, enableMagnetism, enableTilt, glowColor, isInteractive]);

  return (
    <div
      ref={cardRef}
      className={`${className} particle-container`}
      style={{ ...style, position: 'relative', overflow: 'hidden' }}
    >
      {children}
    </div>
  );
};

const GlobalSpotlight = ({
  gridRef,
  disableAnimations = false,
  enabled = true,
  spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS,
  glowColor = DEFAULT_GLOW_COLOR,
  isInteractive = true
}) => {
  const spotlightRef = useRef(null);
  const frameRef = useRef(null);
  const cardsCacheRef = useRef([]);

  useEffect(() => {
    if (disableAnimations || !isInteractive || !gridRef?.current || !enabled) return undefined;

    const spotlight = document.createElement('div');
    spotlight.className = 'global-spotlight';
    spotlight.style.cssText = `
      position: fixed;
      width: 800px;
      height: 800px;
      border-radius: 50%;
      pointer-events: none;
      background: radial-gradient(circle,
        rgba(${glowColor}, 0.15) 0%,
        rgba(${glowColor}, 0.08) 15%,
        rgba(${glowColor}, 0.04) 25%,
        rgba(${glowColor}, 0.02) 40%,
        rgba(${glowColor}, 0.01) 65%,
        transparent 70%
      );
      z-index: 200;
      opacity: 0;
      transform: translate(-50%, -50%);
      mix-blend-mode: screen;
    `;
    document.body.appendChild(spotlight);
    spotlightRef.current = spotlight;

    const gridNode = gridRef.current;
    const sectionNode = gridNode.closest('.bento-section');

    const refreshCardBounds = () => {
      cardsCacheRef.current = Array.from(gridNode.querySelectorAll('.magic-bento-card')).map((node) => ({
        node,
        rect: node.getBoundingClientRect(),
      }));
    };

    const renderSpotlight = (clientX, clientY) => {
      if (!spotlightRef.current) return;

      const sectionRect = sectionNode?.getBoundingClientRect();
      const isInside =
        sectionRect &&
        clientX >= sectionRect.left &&
        clientX <= sectionRect.right &&
        clientY >= sectionRect.top &&
        clientY <= sectionRect.bottom;

      if (!isInside) {
        spotlightRef.current.style.opacity = '0';
        cardsCacheRef.current.forEach(({ node }) => node.style.setProperty('--glow-intensity', '0'));
        return;
      }

      const { proximity, fadeDistance } = calculateSpotlightValues(spotlightRadius);
      let minDistance = Infinity;

      cardsCacheRef.current.forEach(({ node, rect }) => {
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const distance = Math.hypot(clientX - centerX, clientY - centerY) - Math.max(rect.width, rect.height) / 2;
        const effectiveDistance = Math.max(0, distance);
        minDistance = Math.min(minDistance, effectiveDistance);

        let glowIntensity = 0;
        if (effectiveDistance <= proximity) {
          glowIntensity = 1;
        } else if (effectiveDistance <= fadeDistance) {
          glowIntensity = (fadeDistance - effectiveDistance) / (fadeDistance - proximity);
        }

        updateCardGlowProperties(node, rect, clientX, clientY, glowIntensity, spotlightRadius);
      });

      spotlightRef.current.style.left = `${clientX}px`;
      spotlightRef.current.style.top = `${clientY}px`;

      const targetOpacity =
        minDistance <= proximity
          ? 0.8
          : minDistance <= fadeDistance
            ? ((fadeDistance - minDistance) / (fadeDistance - proximity)) * 0.8
            : 0;

      spotlightRef.current.style.opacity = targetOpacity.toString();
    };

    const handlePointerMove = (event) => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = null;
        renderSpotlight(event.clientX, event.clientY);
      });
    };

    const handlePointerLeave = () => {
      cardsCacheRef.current.forEach(({ node }) => node.style.setProperty('--glow-intensity', '0'));
      if (spotlightRef.current) {
        spotlightRef.current.style.opacity = '0';
      }
    };

    refreshCardBounds();
    gridNode.addEventListener('pointermove', handlePointerMove);
    gridNode.addEventListener('pointerleave', handlePointerLeave);
    window.addEventListener('resize', refreshCardBounds);
    window.addEventListener('scroll', refreshCardBounds, { passive: true });

    return () => {
      gridNode.removeEventListener('pointermove', handlePointerMove);
      gridNode.removeEventListener('pointerleave', handlePointerLeave);
      window.removeEventListener('resize', refreshCardBounds);
      window.removeEventListener('scroll', refreshCardBounds);
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      spotlightRef.current?.parentNode?.removeChild(spotlightRef.current);
    };
  }, [disableAnimations, enabled, glowColor, gridRef, isInteractive, spotlightRadius]);

  return null;
};

const BentoCardGrid = ({ children, gridRef }) => (
  <div className="card-grid bento-section" ref={gridRef}>
    {children}
  </div>
);

const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  return isMobile;
};

const StaticCard = ({ card, className, style }) => (
  <div className={className} style={{ ...style, position: 'relative', overflow: 'hidden' }}>
    <CardContent card={card} />
  </div>
);

const MagicBento = ({
  enableStars = true,
  enableSpotlight = true,
  enableBorderGlow = true,
  disableAnimations = false,
  spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS,
  particleCount = DEFAULT_PARTICLE_COUNT,
  enableTilt = false,
  glowColor = DEFAULT_GLOW_COLOR,
  clickEffect = true,
  enableMagnetism = true,
  isActive = true
}) => {
  const gridRef = useRef(null);
  const isMobile = useMobileDetection();
  const { shouldAnimate } = useAnimationBudget(isActive);
  const shouldDisableAnimations = disableAnimations || isMobile || !shouldAnimate;
  const shouldEnableInteractivity = !shouldDisableAnimations;

  return (
    <>
      {enableSpotlight && (
        <GlobalSpotlight
          gridRef={gridRef}
          disableAnimations={shouldDisableAnimations}
          enabled={enableSpotlight}
          spotlightRadius={spotlightRadius}
          glowColor={glowColor}
          isInteractive={shouldEnableInteractivity}
        />
      )}

      <BentoCardGrid gridRef={gridRef}>
        {cardData.map((card, index) => {
          const className = `magic-bento-card ${enableBorderGlow ? 'magic-bento-card--border-glow' : ''}`;
          const style = {
            backgroundColor: card.color,
            '--glow-color': glowColor
          };

          if (enableStars && shouldEnableInteractivity) {
            return (
              <ParticleCard
                key={index}
                className={className}
                style={style}
                disableAnimations={shouldDisableAnimations}
                particleCount={particleCount}
                glowColor={glowColor}
                enableTilt={enableTilt}
                clickEffect={clickEffect}
                enableMagnetism={enableMagnetism}
                isInteractive={shouldEnableInteractivity}
              >
                <CardContent card={card} />
              </ParticleCard>
            );
          }

          return <StaticCard key={index} card={card} className={className} style={style} />;
        })}
      </BentoCardGrid>
    </>
  );
};

export default MagicBento;
