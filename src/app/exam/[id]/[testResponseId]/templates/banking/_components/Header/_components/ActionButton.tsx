export default function ActionButton({
  label,
  title,
  icon,
  onClick,
}: {
  label: string;
  title: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1 text-white hover:text-indigo-700 active:text-indigo-800 transition-colors cursor-pointer px-2 py-1 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white whitespace-nowrap"
      aria-label={label}
      title={title}
      onClick={onClick}
    >
      {icon}
      <span className="hidden sm:inline text-xs font-medium">{label}</span>
    </button>
  );
}
