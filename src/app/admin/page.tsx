import { redirect } from 'next/navigation';

export default function AdminIndex() {
  // Directly redirect to Hizmetler as it's the main OS feature for now
  redirect('/admin/hizmetler');
}
