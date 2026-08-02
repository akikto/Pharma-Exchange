import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '@/components/layout/top-bar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/auth-store';
import { useUpdateProfile } from '@/hooks/use-api';

export function ProfileEditPage() {
  const { user, fetchProfile } = useAuthStore();
  const updateProfile = useUpdateProfile();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
  });
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await updateProfile.mutateAsync(form);
      await fetchProfile();
      navigate('/profile');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div>
      <TopBar title="Edit Profile" showBack />
      <form className="p-4 space-y-4 max-w-md mx-auto" onSubmit={submit}>
        <div><Label>First Name</Label><Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required /></div>
        <div><Label>Last Name</Label><Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required /></div>
        <p className="text-xs text-text-secondary">Email and phone cannot be changed here.</p>
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" className="w-full" loading={updateProfile.isPending}>Save Changes</Button>
      </form>
    </div>
  );
}
