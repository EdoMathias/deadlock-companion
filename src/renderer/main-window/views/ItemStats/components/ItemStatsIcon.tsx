import * as React from 'react';

type Props = React.SVGProps<SVGSVGElement> & {
  size?: number;
  strokeWidth?: number;
};

const ItemStatsIcon = ({ size = 20, strokeWidth = 2, ...props }: Props) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
    <line x1="6.5" y1="5" x2="6.5" y2="8" />
    <line x1="17.5" y1="5" x2="17.5" y2="8" />
  </svg>
);

export default ItemStatsIcon;
