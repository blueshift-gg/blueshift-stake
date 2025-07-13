export interface IconProps {
  className?: string;
  size?: 18 | 14 | 12 | 8;
}

export const ClaimIcon = ({ className, size = 18 }: IconProps) => {
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
        opacity="0.4"
        d="M13.25 2H4.75C3.23122 2 2 3.23122 2 4.75V13.25C2 14.7688 3.23122 16 4.75 16H13.25C14.7688 16 16 14.7688 16 13.25V4.75C16 3.23122 14.7688 2 13.25 2Z"
        fill="currentColor"
      />
      <path
        d="M4.21975 13.7802C4.51275 14.0732 4.98734 14.0732 5.28024 13.7802L10.4999 8.56043V11.25C10.4999 11.6641 10.8358 12 11.2499 12C11.664 12 11.9999 11.6641 11.9999 11.25V6.75C11.9999 6.3359 11.664 6 11.2499 6H6.74995C6.33585 6 5.99995 6.3359 5.99995 6.75C5.99995 7.1641 6.33585 7.5 6.74995 7.5H9.43945L4.21975 12.7197C3.92675 13.0127 3.92675 13.4873 4.21975 13.7802Z"
        fill="currentColor"
      />
    </svg>
  );
};
