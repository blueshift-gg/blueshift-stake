export interface IconProps {
  className?: string;
  size?: 18 | 14 | 12 | 8;
}

export const PlayIcon = ({ className, size = 18 }: IconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 18 18"
      className={className}
      fill="none"
    >
      <g fill="currentColor">
        <path d="M15.1,7.478L5.608,2.222c-.553-.306-1.206-.297-1.749,.023-.538,.317-.859,.877-.859,1.499V14.256c0,.622,.321,1.182,.859,1.499,.279,.164,.586,.247,.895,.247,.293,0,.586-.075,.854-.223l9.491-5.256c.556-.307,.901-.891,.901-1.522s-.345-1.215-.9-1.522Z"></path>
      </g>
    </svg>
  );
};
