export default function HeaderContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <header className="w-full bg-white border border-gray-200 rounded-md shadow-sm px-4 py-3">
      {children}
    </header>
  );
}
