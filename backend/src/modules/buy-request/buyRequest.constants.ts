/** Seller must accept or reject within this many days or the request expires. */
export const BUY_REQUEST_SELLER_RESPONSE_DAYS = 3;

export const BUY_REQUEST_SELLER_RESPONSE_MS =
  BUY_REQUEST_SELLER_RESPONSE_DAYS * 24 * 60 * 60 * 1000;
