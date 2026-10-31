import { noIndex } from "@/lib/site";

export const metadata = { title: "Espace personnel", ...noIndex };

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
