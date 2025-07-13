export interface IconProps {
  className?: string;
  size?: 18 | 14 | 12 | 8;
}

export const FilterIcon = ({ className, size = 18 }: IconProps) => {
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
        d="M12.75 9.75H5.25C4.8359 9.75 4.5 9.4141 4.5 9C4.5 8.5859 4.8359 8.25 5.25 8.25H12.75C13.1641 8.25 13.5 8.5859 13.5 9C13.5 9.4141 13.1641 9.75 12.75 9.75Z"
        fill="currentColor"
      />
      <path
        d="M15.25 5H2.75C2.3359 5 2 4.6641 2 4.25C2 3.8359 2.3359 3.5 2.75 3.5H15.25C15.6641 3.5 16 3.8359 16 4.25C16 4.6641 15.6641 5 15.25 5Z"
        fill="currentColor"
      />
      <path
        d="M10 14.5H8C7.5859 14.5 7.25 14.1641 7.25 13.75C7.25 13.3359 7.5859 13 8 13H10C10.4141 13 10.75 13.3359 10.75 13.75C10.75 14.1641 10.4141 14.5 10 14.5Z"
        fill="currentColor"
      />
    </svg>
  );
};
