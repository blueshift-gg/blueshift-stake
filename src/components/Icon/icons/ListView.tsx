export interface IconProps {
  className?: string;
  size?: 18 | 14 | 12 | 8;
}

export const ListViewIcon = ({ className, size = 18 }: IconProps) => {
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
        d="M15.75 8.25H2.25C1.8359 8.25 1.5 8.5859 1.5 9C1.5 9.4141 1.8359 9.75 2.25 9.75H15.75C16.1641 9.75 16.5 9.4141 16.5 9C16.5 8.5859 16.1641 8.25 15.75 8.25Z"
        fill="currentColor"
      />
      <path
        d="M15.75 3H2.25C1.8359 3 1.5 3.3359 1.5 3.75C1.5 4.1641 1.8359 4.5 2.25 4.5H15.75C16.1641 4.5 16.5 4.1641 16.5 3.75C16.5 3.3359 16.1641 3 15.75 3Z"
        fill="currentColor"
      />
      <path
        d="M15.75 13.5H2.25C1.8359 13.5 1.5 13.8359 1.5 14.25C1.5 14.6641 1.8359 15 2.25 15H15.75C16.1641 15 16.5 14.6641 16.5 14.25C16.5 13.8359 16.1641 13.5 15.75 13.5Z"
        fill="currentColor"
      />
    </svg>
  );
};
