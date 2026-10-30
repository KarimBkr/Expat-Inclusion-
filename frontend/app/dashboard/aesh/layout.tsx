import { DashboardNav } from "@/components/layout/DashboardNav";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DashboardNav space="aesh" />
      {children}
    </>
  );
}
