export default function Loading({ className }: { className?: string }) {
  return (
    <svg
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      x="0px"
      y="0px"
      width="20px"
      height="20px"
      viewBox="0 0 16 16"
      className={className}
    >
      <path
        opacity="0.2"
        d="M8.10044 0.584473C3.97344 0.584473 0.627441 3.93047 0.627441 8.05747C0.627441 12.185 3.97344 15.5305 8.10044 15.5305C12.2274 15.5305 15.5734 12.185 15.5734 8.05747C15.5729 3.93047 12.2274 0.584473 8.10044 0.584473ZM8.10044 13.8745C4.88794 13.8745 2.28344 11.2705 2.28344 8.05747C2.28344 4.84497 4.88794 2.24047 8.10044 2.24047C11.3129 2.24047 13.9169 4.84497 13.9169 8.05747C13.9169 11.2705 11.3129 13.8745 8.10044 13.8745Z"
        fill="black"
      />

      <path
        d="M11.0066 3.02347L11.8336 1.59047C10.7346 0.954473 9.46209 0.584473 8.10059 0.584473V2.24047C9.16009 2.24047 10.1506 2.52847 11.0066 3.02347Z"
        fill="currentColor"
      >
        <animateTransform
          attributeType="xml"
          attributeName="transform"
          type="rotate"
          from="0 8 8"
          to="360 8 8"
          dur="0.5s"
          repeatCount="indefinite"
        />
      </path>
    </svg>
  );
}
