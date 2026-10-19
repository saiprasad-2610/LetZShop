import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface FloatingPortalProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLElement | null>;
  triggerEl?: HTMLElement | null;
  children: React.ReactNode;
  className?: string;
  minWidth?: number;
  align?: 'left' | 'right';
  offset?: number;
}

export const FloatingPortal: React.FC<FloatingPortalProps> = ({
  isOpen,
  onClose,
  triggerRef,
  triggerEl,
  children,
  className = '',
  minWidth = 200,
  align = 'right',
  offset = 4,
}) => {
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<{
    top: number;
    left: number;
    transformOrigin: string;
  } | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getTrigger = () => triggerEl || triggerRef?.current || null;

  const updatePosition = () => {
    const trigger = getTrigger();
    if (!trigger) return;
    const triggerRect = trigger.getBoundingClientRect();
    const popoverEl = popoverRef.current;
    const popoverHeight = popoverEl ? popoverEl.offsetHeight : 220;
    const popoverWidth = popoverEl ? popoverEl.offsetWidth : minWidth;

    const spaceBelow = window.innerHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;

    // Determine vertical placement: flip upwards if not enough space below
    const placeAbove = spaceBelow < popoverHeight + offset && spaceAbove > spaceBelow;

    const top = placeAbove
      ? Math.max(8, triggerRect.top - popoverHeight - offset)
      : Math.min(window.innerHeight - popoverHeight - 8, triggerRect.bottom + offset);

    // Determine horizontal placement
    let left: number;
    if (align === 'right') {
      left = triggerRect.right - popoverWidth;
    } else {
      left = triggerRect.left;
    }

    // Clamp horizontally to stay within viewport
    left = Math.max(8, Math.min(left, window.innerWidth - popoverWidth - 8));

    setPosition({
      top,
      left,
      transformOrigin: `${placeAbove ? 'bottom' : 'top'} ${align === 'right' ? 'right' : 'left'}`,
    });
  };

  useLayoutEffect(() => {
    if (isOpen) {
      updatePosition();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      const trigger = getTrigger();
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        trigger &&
        !trigger.contains(target)
      ) {
        onClose();
      }
    };

    const handleScrollOrResize = () => {
      updatePosition();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('touchstart', handlePointerDown);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('touchstart', handlePointerDown);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen, onClose]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      ref={popoverRef}
      style={{
        position: 'fixed',
        top: position ? `${position.top}px` : '-9999px',
        left: position ? `${position.left}px` : '-9999px',
        transformOrigin: position?.transformOrigin || 'top right',
        zIndex: 9999,
      }}
      className={`animate-in fade-in zoom-in-95 duration-100 ${className}`}
      role="dialog"
      aria-modal="true"
    >
      {children}
    </div>,
    document.body
  );
};
