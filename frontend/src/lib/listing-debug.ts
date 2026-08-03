type ListingDebugPayload = Record<string, unknown>;

/** Dev-only logging for tracing add-to-cart and listing render issues. */
export function debugListingAction(action: string, payload: ListingDebugPayload) {
  if (import.meta.env.DEV) {
    console.log(`[listing:${action}]`, payload);
  }
}

export function warnInvalidListing(action: string, payload: ListingDebugPayload) {
  if (import.meta.env.DEV) {
    console.warn(`[listing:${action}] skipped invalid listing`, payload);
  }
}
