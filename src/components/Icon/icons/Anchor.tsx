export interface IconProps {
  className?: string;
  size?: 18 | 14 | 12 | 8;
}

export const AnchorIcon = ({ className, size = 18 }: IconProps) => {
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
        d="M12.8999 14.3333H10.2998V16.9999H12.8999V14.3333Z"
        fill="#DDEAE0"
      />
      <path
        d="M7.70015 14.3333H5.1001V16.9999H7.70015V14.3333Z"
        fill="#DDEAE0"
      />
      <path
        d="M10.3002 11.6665H7.7002V14.3332H10.3002V11.6665Z"
        fill="#DDEAE0"
      />
      <path d="M10.3002 9H7.7002V11.6667H10.3002V9Z" fill="#DDEAE0" />
      <path
        d="M10.3002 6.33325H7.7002V8.99992H10.3002V6.33325Z"
        fill="#DDEAE0"
      />
      <path
        d="M7.70015 3.66675H5.1001V6.33341H7.70015V3.66675Z"
        fill="#DDEAE0"
      />
      <path
        d="M12.8999 3.66675H10.2998V6.33341H12.8999V3.66675Z"
        fill="#DDEAE0"
      />
      <path d="M10.3002 1H7.7002V3.66667H10.3002V1Z" fill="#DDEAE0" />
      <path d="M5.10005 11.6665H2.5V14.3332H5.10005V11.6665Z" fill="#DDEAE0" />
      <path d="M15.5 11.6665H12.8999V14.3332H15.5V11.6665Z" fill="#DDEAE0" />
    </svg>
  );
};
