export const config = {
  matcher: '/',
};

/** Vercel does not reliably rewrite `/` to serverless functions; redirect to `/api`. */
export default function middleware(request: Request) {
  return Response.redirect(new URL('/api', request.url), 307);
}
