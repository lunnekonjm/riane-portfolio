'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export interface InfoTooltipProps {
  text: React.ReactNode;
  title?: string;
  position?: 'top' | 'bottom' | 'auto';
  align?: 'left' | 'center' | 'right' | 'auto';
  color?: 'cyan' | 'emerald' | 'rose' | 'amber' | 'default';
  theme?: 'cyan' | 'emerald' | 'rose' | 'amber' | 'default';
  width?: number;
  icon?: React.ReactNode;
  size?: number;
  style?: React.CSSProperties;
  className?: string;
}

export default function InfoTooltip({
  text,
  title,
  position = 'auto',
  align = 'auto',
  color = 'cyan',
  theme,
  width = 260,
  icon,
  size = 18,
  style,
  className,
}: InfoTooltipProps) {
  const activeColor = theme || color;
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });
  const triggerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const tooltipWidth = width;
    const tooltipHeight = 110; // estimate

    // Vertical positioning: if top space is tight (< 160px) or position is bottom, place below
    const placeBelow = position === 'bottom' || (position === 'auto' && rect.top < 160);
    const calculatedTop = placeBelow ? rect.bottom + 8 : Math.max(10, rect.top - tooltipHeight - 8);

    // Horizontal positioning:
    let calculatedLeft: number;
    if (align === 'right') {
      // Align right edge of tooltip with right edge of trigger
      calculatedLeft = rect.right - tooltipWidth;
    } else if (align === 'left') {
      // Align left edge of tooltip with left edge of trigger
      calculatedLeft = rect.left;
    } else {
      // Auto: if near right side of viewport (> 65% of screen), align right to avoid clipping
      if (rect.left > window.innerWidth * 0.65) {
        calculatedLeft = rect.right - tooltipWidth;
      } else if (rect.left < window.innerWidth * 0.35) {
        calculatedLeft = rect.left;
      } else {
        calculatedLeft = rect.left + rect.width / 2 - tooltipWidth / 2;
      }
    }

    // Boundary clamping: ensure at least 12px from screen edges
    const clampedLeft = Math.max(12, Math.min(calculatedLeft, window.innerWidth - tooltipWidth - 12));

    setCoords({
      top: calculatedTop,
      left: clampedLeft,
    });
  };

  const handleMouseEnter = () => {
    updatePosition();
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    setIsOpen(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    updatePosition();
    setIsOpen((prev) => !prev);
  };

  // Close when clicking outside or scrolling
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    window.addEventListener('click', handleClickOutside);
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('click', handleClickOutside);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  const colorStyles = {
    cyan: {
      color: 'var(--accent-cyan)',
      bg: 'rgba(6, 182, 212, 0.12)',
      border: 'rgba(6, 182, 212, 0.35)',
      glow: 'rgba(6, 182, 212, 0.25)',
    },
    emerald: {
      color: 'var(--accent-emerald)',
      bg: 'rgba(16, 185, 129, 0.12)',
      border: 'rgba(16, 185, 129, 0.35)',
      glow: 'rgba(16, 185, 129, 0.25)',
    },
    rose: {
      color: 'var(--accent-rose)',
      bg: 'rgba(244, 63, 94, 0.12)',
      border: 'rgba(244, 63, 94, 0.35)',
      glow: 'rgba(244, 63, 94, 0.25)',
    },
    amber: {
      color: 'var(--accent-amber)',
      bg: 'rgba(245, 158, 11, 0.12)',
      border: 'rgba(245, 158, 11, 0.35)',
      glow: 'rgba(245, 158, 11, 0.25)',
    },
    default: {
      color: 'var(--text-secondary)',
      bg: 'rgba(255, 255, 255, 0.08)',
      border: 'rgba(255, 255, 255, 0.2)',
      glow: 'rgba(0, 0, 0, 0.4)',
    },
  }[activeColor || 'cyan'];

  const tooltipPortal = isOpen && mounted && typeof document !== 'undefined' ? (
    <div
      style={{
        position: 'fixed',
        top: coords.top,
        left: coords.left,
        width,
        maxWidth: 'calc(100vw - 24px)',
        background: 'rgba(15, 23, 42, 0.98)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: `1px solid ${colorStyles.border}`,
        borderRadius: 10,
        padding: '10px 14px',
        boxShadow: `0 12px 32px rgba(0, 0, 0, 0.8), 0 0 20px ${colorStyles.glow}`,
        zIndex: 99999999,
        pointerEvents: 'none',
        textAlign: 'left',
        animation: 'fadeIn 0.15s ease-out',
      }}
    >
      {title && (
        <div style={{ fontSize: 12, fontWeight: 700, color: colorStyles.color, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>ℹ️</span>
          <span>{title}</span>
        </div>
      )}
      <div style={{ fontSize: 11.5, color: '#f8fafc', lineHeight: 1.45, letterSpacing: 0.1 }}>
        {text}
      </div>
    </div>
  ) : null;

  return (
    <span
      ref={triggerRef}
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'help',
        verticalAlign: 'middle',
        userSelect: 'none',
        ...style,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      aria-label={typeof text === 'string' ? text : 'Information'}
    >
      {icon ? (
        icon
      ) : (
        <span
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            background: colorStyles.bg,
            border: `1px solid ${colorStyles.border}`,
            color: colorStyles.color,
            fontSize: 11,
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
          }}
        >
          ℹ️
        </span>
      )}

      {mounted && tooltipPortal ? createPortal(tooltipPortal, document.body) : null}
    </span>
  );
}
