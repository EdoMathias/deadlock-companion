import * as React from 'react';

type Props = React.SVGProps<SVGSVGElement> & {
  size?: number;
  strokeWidth?: number;
};

const OverlayEditorIcon = ({ size = 20, strokeWidth = 2, ...props }: Props) => (
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
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <rect x="5" y="6" width="6" height="4" rx="1" />
    <line x1="2" y1="21" x2="22" y2="21" />
    <line x1="9" y1="17" x2="9" y2="21" />
    <line x1="15" y1="17" x2="15" y2="21" />
  </svg>
);

export default OverlayEditorIcon;
