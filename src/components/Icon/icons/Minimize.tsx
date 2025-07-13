export interface IconProps {
  className?: string;
  size?: 18 | 14 | 12 | 8;
}

export const MinimizeIcon = ({ className, size = 8 }: IconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 8 8"
      className={className}
      fill="none"
    >
      <g clipPath="url(#clip0_566_24)">
        <path
          d="M7.49998 3.66667H4.83331C4.55731 3.66667 4.33331 3.44267 4.33331 3.16667V0.5C4.33331 0.224 4.55731 0 4.83331 0C5.10931 0 5.33331 0.224 5.33331 0.5V2.66667H7.49998C7.77598 2.66667 7.99998 2.89067 7.99998 3.16667C7.99998 3.44267 7.77598 3.66667 7.49998 3.66667Z"
          fill="#995600"
        />
        <path
          d="M3.16667 8.00016C2.89067 8.00016 2.66667 7.77616 2.66667 7.50016V5.3335H0.5C0.224 5.3335 0 5.1095 0 4.8335C0 4.5575 0.224 4.3335 0.5 4.3335H3.16667C3.44267 4.3335 3.66667 4.5575 3.66667 4.8335V7.50016C3.66667 7.77616 3.44267 8.00016 3.16667 8.00016Z"
          fill="#995600"
        />
      </g>
      <defs>
        <clipPath id="clip0_566_24">
          <rect width="8" height="8" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};
