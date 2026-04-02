import React, { useState, useEffect } from "react";
import "./UIUX.css";

import hhdImg     from "../assets/hhd.jpg";
import dodgeImg   from "../assets/DODGE.jpg";
import laptopImg  from "../assets/Laptop.jpg";
import monsterImg from "../assets/MONSTER.jpg";
import tintImg    from "../assets/Tint.png";
import pfpImg from "../assets/pfp.png";

const cards = [
  { id: 1, title: "Bass Boosted", desc: "Audio visual identity design", src: hhdImg },
  { id: 2, title: "Dodge",        desc: "Automotive visual campaign",    src: dodgeImg },
  { id: 3, title: "Laptop",       desc: "Tech product visual design",    src: laptopImg },
  { id: 4, title: "Monster",      desc: "Dark branding & poster design", src: monsterImg },
  { id: 5, title: "Tint",         desc: "Beauty & lifestyle campaign",   src: tintImg },
  { id: 6, title: "PFP", desc: "Profile design", src: pfpImg },
];

const UIUX = () => {
  const [activeId,   setActiveId]   = useState(cards[2].id);
  const [previewSrc, setPreviewSrc] = useState(null); // null = modal closed
  const [loadedImages, setLoadedImages] = useState(() => new Set());

  /* close modal on Escape key */
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setPreviewSrc(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const preload = async () => {
      for (const card of cards) {
        const img = new Image();
        img.src = card.src;
        try {
          if (img.decode) {
            await img.decode();
          }
        } catch {
          // Best-effort preload; rendering still works even if decode rejects.
        }

        if (!cancelled) {
          setLoadedImages((current) => {
            if (current.has(card.src)) return current;
            const next = new Set(current);
            next.add(card.src);
            return next;
          });
        }
      }
    };

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(preload, { timeout: 1200 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(idleId);
      };
    }

    const timeoutId = window.setTimeout(preload, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div className="uiux-section">

      {/* ── BACK WALL ── */}
      <div className="uiux-wall" />

      {/* ── FLOOR ── */}
      <div className="uiux-floor-container">
        <div className="uiux-floor" />
      </div>

      {/* ── SPOTLIGHT ── */}
      <div className="uiux-spotlight" />

      {/* ── VIGNETTE ── */}
      <div className="uiux-vignette" />

      {/* ── TYPOGRAPHY ── */}
      <div className="uiux-typography">
        <h1 className="uiux-title">UI-UX</h1>
        <div className="uiux-middle-row">
          <div className="uiux-line" />
          <span className="uiux-amp">&amp;</span>
          <div className="uiux-line" />
        </div>
        <h2 className="uiux-subtitle">Visual Design</h2>
      </div>

      {/* ── ACCORDION CARD GALLERY ── */}
      <div className="uiux-gallery">
        {cards.map((card) => {
          const isActive = card.id === activeId;
          return (
            <div
              key={card.id}
              className={`uiux-card-item${isActive ? " active" : ""}`}
              onClick={() => setActiveId(card.id)}
            >
              <img
                src={card.src}
                alt={card.title}
                draggable={false}
                loading={isActive ? "eager" : "lazy"}
                decoding="async"
              />
              <div className="uiux-card-scrim" />
              <span className="uiux-card-vtitle">{card.title}</span>

              <div className="uiux-card-info">
                <h3>{card.title}</h3>
                <p>{card.desc}</p>
              </div>

              {/* ── expand button — bottom right, only visible on active card ── */}
              {isActive && (
                <button
                  className="uiux-expand-btn"
                  onClick={(e) => {
                    e.stopPropagation(); // don't trigger card click
                    setPreviewSrc(card.src);
                  }}
                  title="View full poster"
                >
                  {/* simple expand icon using unicode */}
                  ⤢
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* ── POSTER MODAL ── */}
      {previewSrc && (
        <div
          className="uiux-modal-backdrop"
          onClick={() => setPreviewSrc(null)}
        >
          <div
            className="uiux-modal-box"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={previewSrc}
              alt="poster preview"
              loading="eager"
              decoding={loadedImages.has(previewSrc) ? "sync" : "async"}
            />
            <button
              className="uiux-modal-close"
              onClick={() => setPreviewSrc(null)}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <span className="uiux-desktop-label">Desktop - 4</span>
    </div>
  );
};

export default UIUX;
