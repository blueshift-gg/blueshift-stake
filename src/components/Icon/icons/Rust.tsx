export interface IconProps {
  className?: string;
  size?: 18 | 14 | 12 | 8;
}

export const RustIcon = ({ className, size = 18 }: IconProps) => {
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
        d="M14.7144 12.4287H12.4287V14.7144H14.7144V12.4287Z"
        fill="#FFAD66"
      />
      <path d="M3.28571 12.4287H1V14.7144H3.28571V12.4287Z" fill="#FFAD66" />
      <path d="M3.28571 10.1426H1V12.4283H3.28571V10.1426Z" fill="#FFAD66" />
      <path d="M3.28571 7.85693H1V10.1426H3.28571V7.85693Z" fill="#FFAD66" />
      <path d="M3.28571 3.28564H1V5.57136H3.28571V3.28564Z" fill="#FFAD66" />
      <path d="M7.857 3.28564H5.57129V5.57136H7.857V3.28564Z" fill="#FFAD66" />
      <path
        d="M5.57185 3.28564H3.28613V5.57136H5.57185V3.28564Z"
        fill="#FFAD66"
      />
      <path
        d="M12.4283 12.4287H10.1426V14.7144H12.4283V12.4287Z"
        fill="#FFAD66"
      />
      <path
        d="M16.9996 10.1426H14.7139V12.4283H16.9996V10.1426Z"
        fill="#FFAD66"
      />
      <path
        d="M14.7144 7.85693H12.4287V10.1426H14.7144V7.85693Z"
        fill="#FFAD66"
      />
      <path
        d="M12.4283 5.57129H10.1426V7.857H12.4283V5.57129Z"
        fill="#FFAD66"
      />
      <path d="M3.28571 5.57129H1V7.857H3.28571V5.57129Z" fill="#FFAD66" />
      <path
        d="M14.7144 3.28564H12.4287V5.57136H14.7144V3.28564Z"
        fill="#FFAD66"
      />
      <path
        d="M16.9996 3.28564H14.7139V5.57136H16.9996V3.28564Z"
        fill="#FFAD66"
      />
      <path d="M7.857 12.4287H5.57129V14.7144H7.857V12.4287Z" fill="#FFAD66" />
      <path d="M7.857 10.1426H5.57129V12.4283H7.857V10.1426Z" fill="#FFAD66" />
      <path
        d="M5.57185 7.85693H3.28613V10.1426H5.57185V7.85693Z"
        fill="#FFAD66"
      />
      <path d="M7.857 5.57129H5.57129V7.857H7.857V5.57129Z" fill="#FFAD66" />
    </svg>
  );
};
