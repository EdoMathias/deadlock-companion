import React, {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import type { ItemMetadata } from '../../../../../shared/types/items';

interface PlayerItemsCellProps {
  itemIds: number[];
  metadata: Map<number, ItemMetadata>;
}

interface TooltipPosition {
  top: number;
  left: number;
  placement: 'above' | 'below';
}

interface ItemIconProps {
  id: number;
  meta: ItemMetadata | undefined;
}

/**
 * A single item icon with a portal-based instant tooltip showing the item name.
 * We avoid the native `title` attribute because of its slow open delay, and we
 * render the tooltip into a portal so it is not clipped by the scoreboard's
 * table/overflow ancestors.
 */
const ItemIcon: React.FC<ItemIconProps> = ({ id, meta }) => {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState<TooltipPosition>({
    top: 0,
    left: 0,
    placement: 'above',
  });
  const anchorRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const label = meta?.name ?? `Item #${id}`;
  const image = meta?.shop_image_webp ?? meta?.shop_image ?? null;

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    const gap = 6;
    const tooltipH = tooltipRef.current?.offsetHeight ?? 0;
    const canFitAbove = rect.top - gap - tooltipH > 0;
    const placement: 'above' | 'below' = canFitAbove ? 'above' : 'below';
    setPos({
      top: placement === 'above' ? rect.top - gap : rect.bottom + gap,
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

  return (
    <>
      <span
        ref={anchorRef}
        className="scoreboard-items__icon"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        tabIndex={0}
        role="img"
        aria-label={label}
      >
        {image ? (
          <img src={image} alt={label} loading="lazy" />
        ) : (
          <span className="scoreboard-items__icon-fallback" aria-hidden="true" />
        )}
      </span>
      {visible &&
        createPortal(
          <div
            ref={tooltipRef}
            role="tooltip"
            className={`scoreboard-items__tooltip scoreboard-items__tooltip--${pos.placement}`}
            style={{ top: pos.top, left: pos.left }}
          >
            {label}
          </div>,
          document.body,
        )}
    </>
  );
};

/**
 * Horizontal row of an enemy player's current items. Overwolf no longer
 * provides damage/heal/level for enemy players, so we surface their item
 * build in place of those columns.
 */
const PlayerItemsCell: React.FC<PlayerItemsCellProps> = ({
  itemIds,
  metadata,
}) => {
  if (!itemIds || itemIds.length === 0) {
    return <span className="scoreboard-items__empty">—</span>;
  }

  return (
    <div className="scoreboard-items">
      {itemIds.map((id, i) => (
        <ItemIcon key={`${id}-${i}`} id={id} meta={metadata.get(id)} />
      ))}
    </div>
  );
};

export default PlayerItemsCell;
