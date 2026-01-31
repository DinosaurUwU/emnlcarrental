import AccountDashboard from "../users/AccountDashboard";
import ProtectedRoute from "../auth/ProtectedRoute";

export default function AccountPage() {
  return (
    <ProtectedRoute onlyUser={true}>
      <AccountDashboard />
    </ProtectedRoute>
  );
}
