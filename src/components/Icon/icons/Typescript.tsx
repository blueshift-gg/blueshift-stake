export interface IconProps {
  className?: string;
  size?: 18 | 14 | 12 | 8;
}

export const TypescriptIcon = ({ className, size = 18 }: IconProps) => {
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
        d="M14.7144 12.4285H12.4287V14.7142H14.7144V12.4285Z"
        fill="#69A2F1"
      />
      <path
        d="M5.57185 12.4285H3.28613V14.7142H5.57185V12.4285Z"
        fill="#69A2F1"
      />
      <path
        d="M5.57185 10.1426H3.28613V12.4283H5.57185V10.1426Z"
        fill="#69A2F1"
      />
      <path
        d="M5.57185 7.85693H3.28613V10.1426H5.57185V7.85693Z"
        fill="#69A2F1"
      />
      <path d="M3.28571 3.28564H1V5.57136H3.28571V3.28564Z" fill="#69A2F1" />
      <path d="M7.857 3.28564H5.57129V5.57136H7.857V3.28564Z" fill="#69A2F1" />
      <path
        d="M5.57185 3.28564H3.28613V5.57136H5.57185V3.28564Z"
        fill="#69A2F1"
      />
      <path
        d="M12.4283 12.4285H10.1426V14.7142H12.4283V12.4285Z"
        fill="#69A2F1"
      />
      <path
        d="M16.9996 10.1426H14.7139V12.4283H16.9996V10.1426Z"
        fill="#69A2F1"
      />
      <path
        d="M14.7144 7.85693H12.4287V10.1426H14.7144V7.85693Z"
        fill="#69A2F1"
      />
      <path
        d="M12.4283 5.57129H10.1426V7.857H12.4283V5.57129Z"
        fill="#69A2F1"
      />
      <path
        d="M5.57185 5.57129H3.28613V7.857H5.57185V5.57129Z"
        fill="#69A2F1"
      />
      <path
        d="M14.7144 3.28564H12.4287V5.57136H14.7144V3.28564Z"
        fill="#69A2F1"
      />
      <path
        d="M16.9996 3.28564H14.7139V5.57136H16.9996V3.28564Z"
        fill="#69A2F1"
      />
    </svg>
  );
};
