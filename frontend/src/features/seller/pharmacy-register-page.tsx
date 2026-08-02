import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '@/components/layout/top-bar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

export function PharmacyRegisterPage() {
  const navigate = useNavigate();
  const fetchProfile = useAuthStore((s) => s.fetchProfile);
  const [step, setStep] = useState<'info' | 'documents'>('info');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    licenseNumber: '',
    address: '',
    city: '',
    district: '',
    postalCode: '',
    description: '',
  });
  const [licenseFile, setLicenseFile] = useState<File | null>(null);

  const submitInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await apiClient.post<{ id: string }>('/pharmacies/register', form);
      void result;
      setStep('documents');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const uploadDocument = async () => {
    if (!licenseFile) {
      setError('Please upload your pharmacy license');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const upload = await apiClient.upload<{ url: string }>('/upload/document', licenseFile);
      await apiClient.post('/pharmacies/documents', {
        type: 'LICENSE',
        fileUrl: upload.url,
        fileName: licenseFile.name,
      });
      await fetchProfile();
      navigate('/pharmacy/pending');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (step === 'documents') {
    return (
      <div>
        <TopBar title="Upload Documents" showBack />
        <div className="p-4 space-y-4 max-w-md mx-auto">
          <p className="text-sm text-text-secondary">Upload your pharmacy license for verification.</p>
          <div>
            <Label>Pharmacy License (PDF or image)</Label>
            <Input type="file" accept=".pdf,image/*" onChange={(e) => setLicenseFile(e.target.files?.[0] ?? null)} />
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button className="w-full" loading={loading} onClick={uploadDocument}>Submit Documents</Button>
          <Button variant="secondary" className="w-full" onClick={() => navigate('/pharmacy/pending')}>Skip for now</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <TopBar title="Register Pharmacy" showBack />
      <form className="p-4 space-y-4 max-w-md mx-auto" onSubmit={submitInfo}>
        <div><Label>Pharmacy Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
        <div><Label>License Number</Label><Input value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} required /></div>
        <div><Label>Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>City</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required /></div>
          <div><Label>District</Label><Input value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} required /></div>
        </div>
        <div><Label>Postal Code</Label><Input value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} /></div>
        <div><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" className="w-full" loading={loading}>Continue to Documents</Button>
      </form>
    </div>
  );
}
