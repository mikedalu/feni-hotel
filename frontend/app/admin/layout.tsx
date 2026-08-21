import Link from "next/link";
import { getServerSession } from "next-auth/next";
import AdminSidebar from "../components/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50 overflow-hidden">
      <AdminSidebar session={session} />

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto bg-gray-50 p-4 md:p-0">
        {children}
      </main>
    </div>
  );
}
