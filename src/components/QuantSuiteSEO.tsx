import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  path?: string;
  type?: 'website' | 'article' | 'product';
  schema?: object;
  keywords?: string[];
  image?: string;
}

const defaultDescription = 'QuantSuite: Institutional-grade quantitative trading platform with real-time market data, advanced options pricing, portfolio optimization, and algorithmic trading tools. RenTech-inspired alpha signals, walk-forward backtesting, and risk analytics.';

const defaultKeywords = [
  'quantitative trading',
  'algorithmic trading',
  'options pricing',
  'portfolio optimization',
  'market analysis',
  'trading platform',
  'financial analytics',
  'alpha signals',
  'backtesting',
  'risk management',
  'QuantSuite',
  'quantitative finance',
  'systematic trading',
  'hedge fund tools',
];

export function QuantSuiteSEO({
  title = 'QuantSuite | Institutional-Grade Quantitative Trading Platform',
  description = defaultDescription,
  path = '',
  type = 'website',
  schema,
  keywords = defaultKeywords,
  image = 'https://quantsuite.app/og-image.png',
}: SEOProps) {
  const url = `https://quantsuite.app${path}`;
  const fullTitle = path ? `${title} | QuantSuite` : title;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(', ')} />
      <link rel="canonical" href={url} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="QuantSuite" />
      <meta property="og:locale" content="en_US" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Hreflang for Geo Targeting */}
      <link rel="alternate" hrefLang="en-US" href={`https://quantsuite.app${path}`} />
      <link rel="alternate" hrefLang="en-GB" href={`https://quantsuite.app${path}`} />
      <link rel="alternate" hrefLang="en-IN" href={`https://quantsuite.app${path}`} />
      <link rel="alternate" hrefLang="x-default" href={`https://quantsuite.app${path}`} />

      {/* Structured Data (JSON-LD) */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            ...schema,
          })}
        </script>
      )}
    </Helmet>
  );
}

// Pre-defined schemas for common pages
export const schemas = {
  organization: {
    '@type': 'Organization',
    name: 'QuantSuite',
    description: 'Institutional-grade quantitative trading platform',
    url: 'https://quantsuite.app',
    logo: 'https://quantsuite.app/logo.png',
    sameAs: [
      'https://twitter.com/quantsuite',
      'https://linkedin.com/company/quantsuite',
    ],
  },

  webApplication: (name: string, description: string, features: string[]) => ({
    '@type': 'WebApplication',
    name,
    applicationCategory: 'FinanceApplication',
    description,
    featureList: features,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  }),

  article: (title: string, description: string, datePublished: string) => ({
    '@type': 'Article',
    headline: title,
    description,
    datePublished,
    author: {
      '@type': 'Organization',
      name: 'QuantSuite',
    },
  }),
};
