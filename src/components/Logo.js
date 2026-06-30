// Brand mark: a result document with a checkmark. Uses currentColor for strokes,
// so set the color via `text-*` (e.g. text-white on a colored tile).
export default function Logo({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M13.5 3.5H7A1.5 1.5 0 0 0 5.5 5v14A1.5 1.5 0 0 0 7 20.5h10A1.5 1.5 0 0 0 18.5 19V8.5L13.5 3.5Z" />
      <path d="M13.5 3.5V8.5H18.5" />
      <path d="M8.6 13.3 11 15.6 15.4 10.9" />
    </svg>
  );
}
