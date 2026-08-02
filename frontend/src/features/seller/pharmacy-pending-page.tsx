import { Link } from 'react-router-dom';
import { Clock, FileText } from 'lucide-react';
import { TopBar } from '@/components/layout/top-bar';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';

export function PharmacyPendingPage() {
  const { user } = useAuthStore();
  const status = user?.pharmacy?.verificationStatus;
  const isRejected = status === 'REJECTED';

  return (
    <div>
      <TopBar title="Verification Status" showBack />
      <div className="p-6 text-center space-y-4 max-w-md mx-auto">
        <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${isRejected ? 'bg-danger/10' : 'bg-warning/10'}`}>
          {isRejected ? <FileText className="h-10 w-10 text-danger" /> : <Clock className="h-10 w-10 text-warning" />}
        </div>
        <h1 className="text-xl font-bold">
          {isRejected ? 'Verification Rejected' : 'Verification Pending'}
        </h1>
        <p className="text-text-secondary text-sm">
          {isRejected
            ? 'Your pharmacy registration was not approved. Please review your documents and resubmit.'
            : 'Your pharmacy documents are under review. We typically respond within 1–2 business days.'}
        </p>
        {user?.pharmacy && (
          <p className="text-sm font-medium">{user.pharmacy.name}</p>
        )}
        <div className="flex flex-col gap-2 pt-4">
          {isRejected && (
            <Link to="/pharmacy/register"><Button className="w-full">Resubmit Registration</Button></Link>
          )}
          <Link to="/profile"><Button variant="secondary" className="w-full">Back to Profile</Button></Link>
        </div>
      </div>
    </div>
  );
}
