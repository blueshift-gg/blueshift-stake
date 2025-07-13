export interface IconProps {
  className?: string;
  size?: 18 | 14 | 12 | 8;
}

export const UnclaimedIcon = ({ className, size = 18 }: IconProps) => {
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
        d="M7.25 9C6.836 9 6.5 8.664 6.5 8.25V5C6.5 3.622 5.378 2.5 4 2.5C2.622 2.5 1.5 3.622 1.5 5V6.25C1.5 6.664 1.164 7 0.75 7C0.336 7 0 6.664 0 6.25V5C0 2.794 1.794 1 4 1C6.206 1 8 2.794 8 5V8.25C8 8.664 7.664 9 7.25 9Z"
        fill="currentColor"
      />
      <path
        d="M13.25 7.5H5.75C4.233 7.5 3 8.733 3 10.25V14.25C3 15.767 4.233 17 5.75 17H13.25C14.767 17 16 15.767 16 14.25V10.25C16 8.733 14.767 7.5 13.25 7.5ZM10.25 12.75C10.25 13.164 9.914 13.5 9.5 13.5C9.086 13.5 8.75 13.164 8.75 12.75V11.75C8.75 11.336 9.086 11 9.5 11C9.914 11 10.25 11.336 10.25 11.75V12.75Z"
        fill="currentColor"
      />
    </svg>
  );
};
