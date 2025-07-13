import classNames from "classnames";

export interface IconProps {
  className?: string;
  size?: 18 | 14 | 12 | 8;
}

export const ShiftArrowIcon = ({ className, size = 18 }: IconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 18 18"
      className={classNames(className, "text-brand-primary")}
      fill="none"
    >
      <path d="M1 12.6667H3.66667V15.3333H1V12.6667Z" fill="currentColor" />
      <path d="M3.66667 10H6.33333V12.6667H3.66667V10Z" fill="currentColor" />
      <path d="M6.33333 7.33333H9V10L6.33333 10V7.33333Z" fill="currentColor" />
      <path
        d="M3.66667 4.66667H6.33333V7.33333H3.66667V4.66667Z"
        fill="currentColor"
      />
      <path d="M1 2H3.66667V4.66667H1V2Z" fill="currentColor" />
      <path d="M9 12.6667H11.6667V15.3333H9V12.6667Z" fill="currentColor" />
      <path
        d="M11.6667 10H14.3333V12.6667L11.6667 12.6667L11.6667 10Z"
        fill="currentColor"
      />
      <path
        d="M14.3333 7.33333H17V10L14.3333 10L14.3333 7.33333Z"
        fill="currentColor"
      />
      <path
        d="M11.6667 4.66667H14.3333L14.3333 7.33333L11.6667 7.33333V4.66667Z"
        fill="currentColor"
      />
      <path d="M9 2H11.6667L11.6667 4.66667L9 4.66667V2Z" fill="currentColor" />
    </svg>
  );
};
