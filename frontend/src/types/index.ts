export interface User {
  id: string;
  email?: string | null;
  phone?: string | null;
  firstName: string;
  lastName: string;
  role: 'USER' | 'ADMIN';
  language?: string;
  theme?: string;
  authProvider?: string;
  pharmacy?: {
    id: string;
    name: string;
    verificationStatus: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
    rating: number;
  } | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

export interface Medicine {
  id: string;
  name: string;
  genericName?: string;
  brandName?: string;
  company: string;
  dosageForm: string;
  strength?: string;
  packSize: string;
  category: string;
  composition?: string;
  imageUrl?: string;
}

export interface Pharmacy {
  id: string;
  name: string;
  city: string;
  district?: string;
  rating: number;
  ratingCount?: number;
  verificationStatus: string;
  logoUrl?: string;
  latitude?: number;
  longitude?: number;
}

export interface Listing {
  id: string;
  batchNumber: string;
  mfgDate: string;
  expiryDate: string;
  sellingPrice: string | number;
  discountPercent: number;
  finalPrice: string | number;
  availableQty: number;
  moq: number;
  unit: string;
  status: string;
  imageUrl?: string;
  medicine: Medicine;
  pharmacy: Pharmacy;
}

export interface CartItem {
  id: string;
  quantity: number;
  listing: Listing;
}

export interface BuyRequest {
  id: string;
  requestNumber: string;
  status: string;
  totalAmount: string | number;
  note?: string;
  sellerNote?: string;
  createdAt: string;
  items: { id: string; quantity: number; unitPrice: string; subtotal: string; listing: Listing }[];
  buyer?: { id: string; firstName: string; lastName: string };
  seller?: Pharmacy;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalAmount: string | number;
  createdAt: string;
  items: { id: string; medicineName: string; quantity: number; unitPrice: string; subtotal: string }[];
  seller?: Pharmacy;
  buyer?: { id: string; firstName: string; lastName: string };
  statusHistory?: { status: string; note?: string; createdAt: string }[];
}

export interface Conversation {
  id: string;
  updatedAt: string;
  members: { user: { id: string; firstName: string; lastName: string } }[];
  messages: Message[];
}

export interface Message {
  id: string;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'VOICE' | 'SYSTEM';
  mediaUrl?: string;
  isRead: boolean;
  createdAt: string;
  sender: { id: string; firstName: string; lastName: string };
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  data?: Record<string, string>;
  createdAt: string;
}

export interface SellerAnalytics {
  todaySales: number;
  orderCount: number;
  pendingBuyRequests: number;
  activeListings: number;
  shortExpiryAlert: number;
  rating: number;
  recentOrders: { id: string; orderNumber: string; status: string; totalAmount: string; createdAt: string }[];
}

export type AppMode = 'buyer' | 'seller';
