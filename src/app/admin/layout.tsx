import type { Metadata } from "next";
import { AuthGate } from "@/components/admin/AuthGate";
import "./admin.css";

export const metadata: Metadata = {
  title: "Portfolio Admin",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AuthGate>{children}</AuthGate>;
}
