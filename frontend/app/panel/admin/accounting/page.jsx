"use client";

import AdminPanelPage from "../page";

// Intentionally not linked in the admin tab bar while the financial view is being refined.
export default function PrivateAccountingPage() {
  return <AdminPanelPage initialTab="accounting" />;
}
