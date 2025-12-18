import React, { useEffect, useRef, useState } from "react";
import "./ScrollReveal.css";
import type { ComponentProperties } from "../types";

interface ScrollRevealProps {
  properties?: ComponentProperties;
  children?: React.ReactNode;
  componentId?: string;
}

/**
 * ScrollReveal component that animates its children when they first scroll into view.
 * Once revealed, the animation stays (doesn't reverse on scroll out).
 */
export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  properties = {},
  children,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  const {
    animationType = "slideUp",
    threshold = 0.2,
    duration = 800,
    delay = 0,
    ...restProps
  } = properties;

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Only trigger once when entering viewport
          if (entry.isIntersecting && !isVisible) {
            setIsVisible(true);
          }
        });
      },
      {
        threshold: Number(threshold) || 0.2,
        rootMargin: "0px",
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [isVisible, threshold]);

  // Map style properties
  const style: React.CSSProperties = {
    padding: restProps.padding,
    margin: restProps.margin,
    backgroundColor: restProps.backgroundColor,
    width: restProps.width || "100%",
    minHeight: restProps.minHeight,
    ...((restProps.style as React.CSSProperties) || {}),
  };

  // Animation CSS variables
  const animationStyle: React.CSSProperties = {
    ...style,
    "--reveal-duration": `${duration}ms`,
    "--reveal-delay": `${delay}ms`,
  } as React.CSSProperties;

  const animationClass = `scroll-reveal-${animationType}`;
  const visibleClass = isVisible ? "scroll-reveal-visible" : "";

  return (
    <div
      ref={containerRef}
      className={`scroll-reveal ${animationClass} ${visibleClass}`}
      style={animationStyle}
    >
      {children}
    </div>
  );
};

export default ScrollReveal;
