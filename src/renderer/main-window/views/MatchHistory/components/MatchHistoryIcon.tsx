import * as React from 'react';

type Props = React.SVGProps<SVGSVGElement> & {
  size?: number;
  strokeWidth?: number;
};

const MatchHistoryIcon = ({ size = 20, strokeWidth = 2, ...props }: Props) => (
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
    <path d="M12 8v4l3 3" />
    <path d="M3.05 11a9 9 0 1 1 .5 4" />
    <path d="M3 16v-5h5" />
  </svg>
);

export default MatchHistoryIcon;
