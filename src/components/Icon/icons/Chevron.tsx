export interface IconProps {
  className?: string;
  size?: 18 | 14 | 12 | 8;
}

export const ChevronIcon = ({ className, size = 18 }: IconProps) => {
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
        d="M8.99975 13.5C8.80775 13.5 8.61575 13.4271 8.46975 13.2801L2.21975 7.03005C1.92675 6.73705 1.92675 6.26202 2.21975 5.96902C2.51275 5.67602 2.98775 5.67602 3.28075 5.96902L9.00075 11.689L14.7208 5.96902C15.0138 5.67602 15.4888 5.67602 15.7818 5.96902C16.0748 6.26202 16.0748 6.73705 15.7818 7.03005L9.53175 13.2801C9.38575 13.4261 9.19375 13.5 9.00175 13.5H8.99975Z"
        fill="currentColor"
      />
    </svg>
  );
};
