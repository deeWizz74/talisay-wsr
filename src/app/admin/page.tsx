import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  return <AdminDashboard username={user.username} />;
}
