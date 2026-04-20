import * as React from 'react';

type Props = React.SVGProps<SVGSVGElement> & {
  size?: number;
  strokeWidth?: number;
};

const HeroStatsIcon = ({ size = 20, strokeWidth = 2, ...props }: Props) => (
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
    <rect x="4" y="12" width="4" height="9" rx="1" />
    <rect x="10" y="4" width="4" height="17" rx="1" />
    <rect x="16" y="8" width="4" height="13" rx="1" />
  </svg>
);

export default HeroStatsIcon;
