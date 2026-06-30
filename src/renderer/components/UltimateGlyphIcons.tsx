import * as React from 'react';

type Props = React.SVGProps<SVGSVGElement> & {
  size?: number;
};

/** Filled lightning bolt — "Ult Ready" (off cooldown). */
export const UltReadyIcon = ({ size = 16, ...props }: Props) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    {...props}
  >
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

/** Filled star — "Ult Unlocked" (first trained). */
export const UltUnlockedIcon = ({ size = 16, ...props }: Props) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    {...props}
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
