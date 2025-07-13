export interface IconProps {
  className?: string;
  size?: 18 | 14 | 12 | 8;
}

export const LockedIcon = ({ className, size = 18 }: IconProps) => {
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
        d="M12.25 9C11.836 9 11.5 8.664 11.5 8.25V5C11.5 3.622 10.378 2.5 9 2.5C7.622 2.5 6.5 3.622 6.5 5V8.25C6.5 8.664 6.164 9 5.75 9C5.336 9 5 8.664 5 8.25V5C5 2.794 6.794 1 9 1C11.206 1 13 2.794 13 5V8.25C13 8.664 12.664 9 12.25 9Z"
        fill="currentColor"
      />
      <path
        d="M12.75 7.5H5.25C3.733 7.5 2.5 8.733 2.5 10.25V14.25C2.5 15.767 3.733 17 5.25 17H12.75C14.267 17 15.5 15.767 15.5 14.25V10.25C15.5 8.733 14.267 7.5 12.75 7.5ZM9.75 12.75C9.75 13.164 9.414 13.5 9 13.5C8.586 13.5 8.25 13.164 8.25 12.75V11.75C8.25 11.336 8.586 11 9 11C9.414 11 9.75 11.336 9.75 11.75V12.75Z"
        fill="currentColor"
      />
    </svg>
  );
};
