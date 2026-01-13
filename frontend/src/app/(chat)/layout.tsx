export default function ChatboxLayout({ children }: { children: React.ReactNode }) {
  // ✅ không render Header/Footer ở đây
  return <>{children}</>;
}
