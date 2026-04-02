import { lazy, useEffect, useRef, useState } from 'react'
import { Analytics } from '@vercel/analytics/react'
import DeferredSection from './components/DeferredSection'
import './App.css'
import logo from './assets/logo.png'

const Silk = lazy(() => import('./components/Silk'))
const MagicBento = lazy(() => import('./components/MagicBento'))
const UIUXInline = lazy(() => import('./pages/UIUX'))
const TechStack = lazy(() => import('./pages/TechStack'))
const NebulaBackground = lazy(() => import('./components/NebulaBackground.jsx'))
const NeuralCircuit = lazy(() => import('./components/NeuralCircuit'))
const AboutMe = lazy(() => import('./pages/AboutMe'))

function App() {
  const [moreOpen, setMoreOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [hoverImg, setHoverImg] = useState('')
  const [showHeroBackground, setShowHeroBackground] = useState(false)
  const dropdownRef = useRef(null)
  const hamburgerRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setMoreOpen(false)
      }
      if (hamburgerRef.current && !hamburgerRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('touchstart', handler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('touchstart', handler)
    }
  }, [])

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setShowHeroBackground(true)
    })

    return () => window.cancelAnimationFrame(frameId)
  }, [])

  useEffect(() => {
    let cancelled = false
    const warmHoverAsset = () => {
      import('./assets/hover.jpg').then((module) => {
        if (!cancelled) {
          setHoverImg(module.default)
        }
      })
    }

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(warmHoverAsset, { timeout: 1200 })
      return () => {
        cancelled = true
        window.cancelIdleCallback(idleId)
      }
    }

    const timeoutId = window.setTimeout(warmHoverAsset, 300)
    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [])

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setMoreOpen(false)
    setMenuOpen(false)
  }

  return (
    <div className="app">

      <section className="hero-container">
        <div className="background">
          {showHeroBackground ? <Silk color="#102A5E" /> : null}
        </div>

        <section className="hero-section">
          <div className="topbar">

            {/* Desktop navbar */}
            <div className="navbar">
              <button className="nav-btn">Home</button>
              <button className="nav-btn" onClick={() => scrollTo('projects-section')}>
                Projects
              </button>
              <div className="nav-more-wrapper" ref={dropdownRef}>
                <button
                  className={`nav-btn${moreOpen ? ' nav-btn--active' : ''}`}
                  onClick={() => setMoreOpen(p => !p)}
                >
                  More ▾
                </button>
                {moreOpen && (
                  <div className="nav-dropdown">
                    <button className="nav-drop-item" onClick={() => scrollTo('uiux-section')}>UI/UX</button>
                    <button className="nav-drop-item" onClick={() => scrollTo('techstack-section')}>Tech Stack</button>
                    <button className="nav-drop-item" onClick={() => scrollTo('aboutme-section')}>About Me</button>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile hamburger */}
            <div className="hamburger-wrapper" ref={hamburgerRef}>
              <button
                className={`hamburger${menuOpen ? ' open' : ''}`}
                onClick={() => setMenuOpen(p => !p)}
                aria-label="Open menu"
              >
                <span />
                <span />
                <span />
              </button>
              {menuOpen && (
                <div className="mobile-menu">
                  <button className="mobile-menu-item" onClick={() => scrollTo('projects-section')}>Projects</button>
                  <button className="mobile-menu-item" onClick={() => scrollTo('uiux-section')}>UI / UX</button>
                  <button className="mobile-menu-item" onClick={() => scrollTo('techstack-section')}>Tech Stack</button>
                  <button className="mobile-menu-item" onClick={() => scrollTo('aboutme-section')}>About Me</button>
                </div>
              )}
            </div>

            {/* Logo */}
            <div className="branding">
              <div className="brand-text">
                <p>Defined by blue design aesthetics</p>
                <p>Creative</p>
                <p>Unique</p>
              </div>
              <img src={logo} alt="logo" />
            </div>
          </div>

          <div className="hero">
            <h1>A PORTFOLIO BUILT AROUND FLOW, SUBTLE MOTION, AND PURPOSEFUL DESIGN.</h1>
            <h2 className="typewriter">
              <span className="typing-text">everything here is intentional</span>
              <span className="cursor">|</span>
            </h2>
            <div className="explore-wrapper">
              <button
                className="explore-btn"
                style={hoverImg ? { '--hover-image': `url(${hoverImg})` } : undefined}
                onClick={() => scrollTo('projects-section')}
              >
                Explore More
              </button>
            </div>
            <div className="arrow" onClick={() => scrollTo('projects-section')}>↓</div>
          </div>
        </section>
      </section>

      <DeferredSection
        id="projects-section"
        className="projects-wrapper"
        minHeight="100vh"
        rootMargin="500px 0px"
        fallback={<div className="section-skeleton section-skeleton--projects" />}
      >
        {(isVisible) => (
          <>
        <NebulaBackground isActive={isVisible} />
        <h1 style={{
          fontFamily: '"Times New Roman", serif',
          fontSize: 'clamp(3rem, 6vw, 5rem)',
          fontWeight: 300,
          textTransform: 'uppercase',
          letterSpacing: '-0.02em',
          margin: '0 0 0 5%',
          paddingTop: '2px',
          position: 'relative',
          zIndex: 10,
          display: 'inline-block',
          background: 'linear-gradient(90deg, #ffffff 0%, #a8c0ff 35%, #3b6cff 65%, #0033cc 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>PROJECTS</h1>
        <MagicBento
          isActive={isVisible}
          textAutoHide enableStars enableSpotlight enableBorderGlow
          enableTilt={false} enableMagnetism={false} clickEffect
          spotlightRadius={400} particleCount={12} glowColor="20, 76, 196"
        />
          </>
        )}
      </DeferredSection>

      <DeferredSection
        id="uiux-section"
        minHeight="100vh"
        rootMargin="400px 0px"
        fallback={<div className="section-skeleton section-skeleton--uiux" />}
      >
        {() => <UIUXInline />}
      </DeferredSection>

      <DeferredSection
        id="techstack-section"
        style={{ position: 'relative' }}
        minHeight="100vh"
        rootMargin="400px 0px"
        fallback={<div className="section-skeleton section-skeleton--techstack" />}
      >
        {(isVisible) => (
          <>
            <NeuralCircuit isActive={isVisible} />
            <TechStack isActive={isVisible} />
          </>
        )}
      </DeferredSection>

      <DeferredSection
        id="aboutme-section"
        minHeight="100vh"
        rootMargin="300px 0px"
        fallback={<div className="section-skeleton section-skeleton--about" />}
      >
        {(isVisible) => <AboutMe isActive={isVisible} />}
      </DeferredSection>

      <Analytics />
    </div>
  )
}

export default App
