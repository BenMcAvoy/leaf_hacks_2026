"use client";

import { useEffect, useRef, useState } from "react";

export function CursorEffect() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [isClicking, setIsClicking] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let currentX = mouseX;
    let currentY = mouseY;
    let rafId: number;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      setIsVisible(true);
    };

    const onMouseDown = () => setIsClicking(true);
    const onMouseUp = () => setIsClicking(false);
    const onMouseLeave = () => setIsVisible(false);
    const onMouseEnter = () => setIsVisible(true);

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mousedown", onMouseDown, { passive: true });
    window.addEventListener("mouseup", onMouseUp, { passive: true });
    document.addEventListener("mouseleave", onMouseLeave, { passive: true });
    document.addEventListener("mouseenter", onMouseEnter, { passive: true });

    const animate = () => {
      // Very smooth 8% lerp for a trailing feel
      currentX += (mouseX - currentX) * 0.08;
      currentY += (mouseY - currentY) * 0.08;

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${currentX}px, ${currentY}px) scale(${isClicking ? 0.8 : 1})`;
      }

      rafId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("mouseenter", onMouseEnter);
      cancelAnimationFrame(rafId);
    };
  }, [isClicking]);

  return (
    /*
     * z-0 keeps this behind every card/nav/text (which sit at z-10+).
     * mix-blend-mode: screen means the glow only brightens the raw
     * background pixels beneath it. Wherever a card or text element
     * covers the background, the blend has nothing to work with and
     * the effect is invisible — exactly the "wallpaper area only" feel.
     */
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      style={{ mixBlendMode: "screen" }}
      aria-hidden="true"
    >
      <div
        ref={cursorRef}
        className="absolute top-0 left-0 will-change-transform"
        style={{
          width: "700px",
          height: "700px",
          marginLeft: "-350px",
          marginTop: "-350px",
          transition: "opacity 600ms ease",
          opacity: isVisible ? 1 : 0,
        }}
      >
        {/* Primary high-quality aurora glow — tight hot core fading out wide */}
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            background: `radial-gradient(circle at 50% 50%,
              hsl(210 100% 80% / 0.55)   0%,
              hsl(225 90%  70% / 0.40)   8%,
              hsl(250 85%  65% / 0.28)  18%,
              hsl(270 80%  60% / 0.18)  30%,
              hsl(290 75%  55% / 0.10)  44%,
              hsl(310 70%  50% / 0.05)  58%,
              transparent               72%)`,
            filter: "blur(2px)",
          }}
        />
        {/* Secondary outer color halo for depth — offset slightly for a 3-D aurora feel */}
        <div
          style={{
            position: "absolute",
            inset: "60px",
            borderRadius: "50%",
            background: `radial-gradient(circle at 40% 40%,
              hsl(180 100% 75% / 0.20)  0%,
              hsl(200 95%  65% / 0.12) 25%,
              transparent              60%)`,
            filter: "blur(18px)",
          }}
        />
      </div>
    </div>
  );
}
