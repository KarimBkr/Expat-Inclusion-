import { noIndex } from "@/lib/site";

export const metadata = noIndex;

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
