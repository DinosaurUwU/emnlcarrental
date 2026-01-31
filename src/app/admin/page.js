import ProtectedRoute from "../auth/ProtectedRoute";
import AdminDashboard from "./AdminDashboard";

export default function AdminPage() {
  return (
    <ProtectedRoute onlyAdmin>
      <AdminDashboard />
    </ProtectedRoute>
  );
}