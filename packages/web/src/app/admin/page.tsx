// packages/web/src/app/admin/page.tsx

import { redirect } from 'next/navigation';

export default function AdminPage() {
  // Check if user has valid token, redirect to dashboard or login
  redirect('/admin/dashboard');
}
