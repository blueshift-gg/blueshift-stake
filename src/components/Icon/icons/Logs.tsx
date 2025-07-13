export interface IconProps {
  className?: string;
  size?: 18 | 14 | 12 | 8;
}

export const LogsIcon = ({ className, size = 8 }: IconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      className={className}
      viewBox="0 0 18 18"
    >
      <g fill="currentColor">
        <path d="M6.412,9.876l-2.877,3.74-.755-.755c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l1.359,1.359c.142,.141,.332,.22,.53,.22,.017,0,.032,0,.049-.001,.215-.014,.414-.12,.546-.291l3.397-4.417c.252-.329,.19-.799-.138-1.052-.329-.254-.798-.19-1.052,.137Z"></path>
        <path d="M16.25,4.5h-6c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h6c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"></path>
        <path d="M16.25,12h-6c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h6c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"></path>
        <rect x="1.5" y="2" width="6" height="6" rx="1.75" ry="1.75"></rect>
      </g>
    </svg>
  );
};
