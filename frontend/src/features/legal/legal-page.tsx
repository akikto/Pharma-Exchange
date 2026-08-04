/**
 * Shared layout for /privacy-policy and /terms-and-conditions.
 *
 * BL-04 / BL-05 · Sprint 4.
 * - Mobile-first, respects the existing design system tokens.
 * - Dark-mode friendly (uses semantic color classes only).
 * - Print-friendly (removes chrome via @media print).
 * - Accessible: <main> landmark, single <h1>, focusable back link,
 *   correct heading hierarchy.
 */
import { useEffect, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface LegalPageProps {
  /** Short slug used for the CSS class and `data-testid` root. */
  id: 'privacy-policy' | 'terms-and-conditions';
  title: string;
  effectiveDate: string;      // YYYY-MM-DD, rendered as ISO for machine readers
  lastReviewed: string;       // YYYY-MM-DD
  seoDescription: string;
  children: ReactNode;
}

export function LegalPage({ id, title, effectiveDate, lastReviewed, seoDescription, children }: LegalPageProps) {
  const navigate = useNavigate();

  // Minimal in-page SEO metadata. The app is an SPA — we set document.title
  // and a meta description on mount and restore on unmount.
  useEffect(() => {
    const prevTitle = document.title;
    document.title = `${title} · Pharma-Exchange`;

    const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const prevDesc = meta?.content ?? '';
    if (meta) meta.content = seoDescription;
    else {
      const m = document.createElement('meta');
      m.name = 'description';
      m.content = seoDescription;
      document.head.appendChild(m);
    }
    return () => {
      document.title = prevTitle;
      if (meta) meta.content = prevDesc;
    };
  }, [title, seoDescription]);

  return (
    <main
      data-testid={`${id}-page`}
      className="mx-auto w-full max-w-3xl px-4 pb-24 pt-6 text-text-primary sm:px-6 sm:pt-10"
    >
      <div className="mb-6 flex items-center justify-between gap-2 print:hidden">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
          className="gap-2"
          data-testid={`${id}-back`}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.print()}
          className="gap-2"
          data-testid={`${id}-print`}
        >
          <Printer className="h-4 w-4" />
          <span>Print</span>
        </Button>
      </div>

      <header className="mb-8 border-b border-border-subtle pb-6">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl" data-testid={`${id}-title`}>
          {title}
        </h1>
        <p className="mt-3 text-sm text-text-secondary">
          <span>Effective date: </span>
          <time dateTime={effectiveDate}>{effectiveDate}</time>
          <span className="mx-2 hidden sm:inline">·</span>
          <br className="sm:hidden" />
          <span>Last reviewed: </span>
          <time dateTime={lastReviewed}>{lastReviewed}</time>
        </p>
        <p className="mt-3 text-sm text-text-secondary">
          Pharma-Exchange is operated in the People's Republic of Bangladesh. If
          you have questions about this document, contact us at{' '}
          <a className="underline" href="mailto:legal@pharma-exchange.bd">
            legal@pharma-exchange.bd
          </a>
          .
        </p>
      </header>

      {/* Prose body — Tailwind-independent so we don't add a plugin. */}
      <article className="legal-prose space-y-6 text-[15px] leading-relaxed">
        {children}
      </article>

      <footer className="mt-12 border-t border-border-subtle pt-6 text-sm text-text-secondary print:hidden">
        <p>
          See also:{' '}
          <Link
            className="underline"
            to={id === 'privacy-policy' ? '/terms-and-conditions' : '/privacy-policy'}
          >
            {id === 'privacy-policy' ? 'Terms & Conditions' : 'Privacy Policy'}
          </Link>
        </p>
      </footer>
    </main>
  );
}
