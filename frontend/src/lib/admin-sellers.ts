export type PharmacyVerificationStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';

export interface AdminSellerListItem {
  id: string;
  name: string;
  city: string;
  district: string;
  licenseNumber: string;
  verificationStatus: PharmacyVerificationStatus;
  isActive: boolean;
  rating: number;
  createdAt: string;
  listingCount: number;
  owner: {
    id: string;
    email: string;
    phone: string | null;
    name: string;
  } | null;
}

export interface AdminSellerDocument {
  id: string;
  type: string;
  fileUrl: string;
  fileName: string;
  uploadedAt: string;
}

export interface AdminSellerDetail extends Omit<AdminSellerListItem, 'listingCount'> {
  address: string;
  postalCode: string | null;
  rejectionReason: string | null;
  description: string | null;
  documents: AdminSellerDocument[];
  listingCount: number;
  activeListingCount: number;
  orderCount: number;
  buyRequestCount: number;
  reviewCount: number;
  canPermanentlyDelete: boolean;
}

export interface AdminPharmacyUpdatePayload {
  isActive?: boolean;
  name?: string;
  licenseNumber?: string;
  address?: string;
  city?: string;
  district?: string;
  postalCode?: string | null;
  description?: string | null;
}

export function verificationStatusVariant(
  status: PharmacyVerificationStatus,
): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
  switch (status) {
    case 'APPROVED':
      return 'success';
    case 'REJECTED':
      return 'danger';
    case 'UNDER_REVIEW':
      return 'info';
    case 'PENDING':
    default:
      return 'warning';
  }
}
