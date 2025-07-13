export interface IconProps {
  className?: string;
  size?: 18 | 14 | 12 | 8;
}

export const ArrowRightIcon = ({ className, size = 18 }: IconProps) => {
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
        d="M15 9.75H2.75C2.336 9.75 2 9.414 2 9C2 8.586 2.336 8.25 2.75 8.25H15C15.414 8.25 15.75 8.586 15.75 9C15.75 9.414 15.414 9.75 15 9.75Z"
        fill="currentColor"
      />
      <path
        d="M11.0002 14C10.8082 14 10.6162 13.927 10.4702 13.78C10.1772 13.487 10.1772 13.012 10.4702 12.719L14.1902 8.99904L10.4702 5.27904C10.1772 4.98604 10.1772 4.51104 10.4702 4.21804C10.7632 3.92504 11.2382 3.92504 11.5312 4.21804L15.7812 8.46804C16.0742 8.76104 16.0742 9.23604 15.7812 9.52904L11.5312 13.779C11.3852 13.925 11.1932 13.999 11.0012 13.999L11.0002 14Z"
        fill="currentColor"
      />
    </svg>
  );
};
