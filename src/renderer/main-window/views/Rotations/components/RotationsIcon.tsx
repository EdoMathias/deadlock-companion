import * as React from "react";

type Props = React.SVGProps<SVGSVGElement> & {
  size?: number;
  strokeWidth?: number;
};

const RotationsIcon = ({
  size = 20,
  strokeWidth = 2,
  ...props
}: Props) => {
  return (
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
      <path d="M20 6v5h-5" />
      <path d="M20 11a8 8 0 0 0-13.66-5.66" />

      <path d="M4 18v-5h5" />
      <path d="M4 13a8 8 0 0 0 13.66 5.66" />
    </svg>
  );
};

export default RotationsIcon;
