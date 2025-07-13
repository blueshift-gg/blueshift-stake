export interface IconProps {
  className?: string;
  size?: 18 | 14 | 12 | 8;
}

export const TableIcon = ({ className, size = 18 }: IconProps) => {
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
        d="M15.75 9.75H2.25C1.836 9.75 1.5 9.414 1.5 9C1.5 8.586 1.836 8.25 2.25 8.25H15.75C16.164 8.25 16.5 8.586 16.5 9C16.5 9.414 16.164 9.75 15.75 9.75Z"
        fill="currentColor"
      />
      <path
        d="M15.75 4.5H9.75C9.336 4.5 9 4.164 9 3.75C9 3.336 9.336 3 9.75 3H15.75C16.164 3 16.5 3.336 16.5 3.75C16.5 4.164 16.164 4.5 15.75 4.5Z"
        fill="currentColor"
      />
      <path
        d="M8.25 15H2.25C1.836 15 1.5 14.664 1.5 14.25C1.5 13.836 1.836 13.5 2.25 13.5H8.25C8.664 13.5 9 13.836 9 14.25C9 14.664 8.664 15 8.25 15Z"
        fill="currentColor"
      />
    </svg>
  );
};
