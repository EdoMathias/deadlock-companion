import React, {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

interface InfoIconProps {
  /** Tooltip text shown on hover / focus. */
  title?: string;
  /** Accessible label for the icon itself. Defaults to "Info". */
  ariaLabel?: string;
  /** Extra class name. */
  className?: string;
  /** Icon size in px. Defaults to 14. */
  size?: number;
  onClick?: (e: React.MouseEvent) => void;
}

interface TooltipPosition {
  top: number;
  left: number;
  placement: 'below' | 'above';
}

/**
 * Inline Lucide "Info" icon with a custom instant tooltip. We don't use the
 * native `title` attribute because browsers impose a ~1s open delay that
 * makes the tooltip feel sluggish. The tooltip is rendered into a portal so
 * it cannot be clipped by ancestor `overflow` (e.g. scrollable tables) and
 * auto-flips above the anchor if it would run off the bottom of the viewport.
 */
const InfoIcon: React.FC<InfoIconProps> = ({
  title,
  ariaLabel = 'Info',
  className,
  size = 14,
  onClick,
}) => {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState<TooltipPosition>({
    top: 0,
    left: 0,
    placement: 'below',
  });
  const anchorRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const tooltipId = useId();

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    const gap = 6;
    const tooltipH = tooltipRef.current?.offsetHeight ?? 0;
    const wouldOverflowBottom = rect.bottom + gap + tooltipH > window.innerHeight;
    const canFitAbove = rect.top - gap - tooltipH > 0;
    const placement: 'below' | 'above' =
      wouldOverflowBottom && canFitAbove ? 'above' : 'below';
    setPos({
      top: placement === 'below' ? rect.bottom + gap : rect.top - gap,
      left: rect.left + rect.width / 2,
      placement,
    });
  }, []);

  useLayoutEffect(() => {
    if (!visible) return;
    updatePosition();
    const onReflow = () => updatePosition();
    window.addEventListener('scroll', onReflow, true);
    window.addEventListener('resize', onReflow);
    return () => {
      window.removeEventListener('scroll', onReflow, true);
      window.removeEventListener('resize', onReflow);
    };
  }, [visible, updatePosition]);

  // Measure again once the tooltip element itself is in the DOM so the
  // placement flip uses the real height, not 0.
  useEffect(() => {
    if (visible) updatePosition();
  }, [visible, title, updatePosition]);

  const show = () => setVisible(true);
  const hide = () => setVisible(false);

  return (
    <>
      <span
        ref={anchorRef}
        className={`info-icon${className ? ` ${className}` : ''}`}
        role="img"
        aria-label={ariaLabel}
        aria-describedby={visible && title ? tooltipId : undefined}
        tabIndex={title ? 0 : undefined}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        onClick={onClick}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
      </span>
      {visible &&
        title &&
        createPortal(
          <div
            ref={tooltipRef}
            id={tooltipId}
            role="tooltip"
            className={`info-icon-tooltip info-icon-tooltip--${pos.placement}`}
            style={{ top: pos.top, left: pos.left }}
          >
            {title}
          </div>,
          document.body,
        )}
    </>
  );
};

export default InfoIcon;
