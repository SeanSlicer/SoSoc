import { type Metadata } from "next";
import AdminDashboard from "~/app/components/admin/AdminDashboard";

export const metadata: Metadata = { title: "Admin Dashboard — sosoc" };

export default function AdminPage() {
  return <AdminDashboard />;
}
