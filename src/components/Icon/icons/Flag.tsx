export interface IconProps {
  className?: string;
  size?: 18 | 14 | 12 | 8;
}

export const FlagIcon = ({ className, size = 18 }: IconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 18 18"
      className={className}
      fill="none"
    >
      <path
        d="M14.25 5H13V4.25C13 3.285 12.215 2.5 11.25 2.5H4V10H11.146C11.369 10 11.48 10.27 11.323 10.427L9.65 12.1C9.952 12.346 10.331 12.5 10.75 12.5H14.25C15.215 12.5 16 11.715 16 10.75V6.75C16 5.785 15.215 5 14.25 5Z"
        fill="currentColor"
      />
      <path
        d="M3.75 17C3.336 17 3 16.664 3 16.25V1.75C3 1.336 3.336 1 3.75 1C4.164 1 4.5 1.336 4.5 1.75V16.25C4.5 16.664 4.164 17 3.75 17Z"
        fill="currentColor"
      />
    </svg>
  );
};
