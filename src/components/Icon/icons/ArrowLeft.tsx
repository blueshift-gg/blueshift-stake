export interface IconProps {
  className?: string;
  size?: 18 | 14 | 12 | 8;
}

export const ArrowLeftIcon = ({ className, size = 18 }: IconProps) => {
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
        d="M15.25 9.75H3C2.586 9.75 2.25 9.414 2.25 9C2.25 8.586 2.586 8.25 3 8.25H15.25C15.664 8.25 16 8.586 16 9C16 9.414 15.664 9.75 15.25 9.75Z"
        fill="currentColor"
      />
      <path
        d="M7.00024 14C6.80824 14 6.61624 13.927 6.47024 13.78L2.22024 9.52999C1.92724 9.23699 1.92724 8.76199 2.22024 8.46899L6.47024 4.21999C6.76324 3.92699 7.23824 3.92699 7.53124 4.21999C7.82424 4.51299 7.82424 4.98799 7.53124 5.28099L3.81124 9.00099L7.53124 12.721C7.82424 13.014 7.82424 13.489 7.53124 13.782C7.38524 13.928 7.19324 14.002 7.00124 14.002L7.00024 14Z"
        fill="currentColor"
      />
    </svg>
  );
};
