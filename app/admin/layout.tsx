// app/admin/layout.tsx
import AdminNavbar from "@/components/Navbar";
import RequireAdmin from "@/guards/RequireAdmin";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <RequireAdmin>
            <AdminNavbar />
            {children}
        </RequireAdmin>
    );
}