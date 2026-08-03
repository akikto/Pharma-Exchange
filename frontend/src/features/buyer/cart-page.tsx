import { Navigate } from 'react-router-dom';
import { RequestsHubPage } from './requests-hub-page';

/** Tabbed Cart / Orders / Buy Requests hub (Phase 6) */
export function CartPage() {
  return <RequestsHubPage />;
}

/** @deprecated Use /cart?tab=orders */
export function OrdersPage() {
  return <Navigate to="/cart?tab=orders" replace />;
}

/** @deprecated Use /cart?tab=requests */
export function BuyRequestsPage() {
  return <Navigate to="/cart?tab=requests" replace />;
}
