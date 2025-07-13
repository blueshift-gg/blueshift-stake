export interface IconProps {
  className?: string;
  size?: 18 | 14 | 12 | 8;
}

export const GridViewIcon = ({ className, size = 18 }: IconProps) => {
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
        d="M14.25 2H11.75C10.7835 2 10 2.7835 10 3.75V6.25C10 7.2165 10.7835 8 11.75 8H14.25C15.2165 8 16 7.2165 16 6.25V3.75C16 2.7835 15.2165 2 14.25 2Z"
        fill="currentColor"
      />
      <path
        d="M6.25 10H3.75C2.7835 10 2 10.7835 2 11.75V14.25C2 15.2165 2.7835 16 3.75 16H6.25C7.2165 16 8 15.2165 8 14.25V11.75C8 10.7835 7.2165 10 6.25 10Z"
        fill="currentColor"
      />
      <path
        d="M6.25 2H3.75C2.7835 2 2 2.7835 2 3.75V6.25C2 7.2165 2.7835 8 3.75 8H6.25C7.2165 8 8 7.2165 8 6.25V3.75C8 2.7835 7.2165 2 6.25 2Z"
        fill="currentColor"
      />
      <path
        d="M14.25 10H11.75C10.7835 10 10 10.7835 10 11.75V14.25C10 15.2165 10.7835 16 11.75 16H14.25C15.2165 16 16 15.2165 16 14.25V11.75C16 10.7835 15.2165 10 14.25 10Z"
        fill="currentColor"
      />
    </svg>
  );
};
