import { Helmet } from 'react-helmet-async';

export default function SEO({
    title,
    description,
    image = '/maple-leaf-icon.webp',
    url,
    type = 'website',
    lang = 'en'
}) {
    const siteTitle = lang === 'en' ? 'Historic Places Canada 2' : 'Lieux patrimoniaux du Canada 2';
    const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;
    const currentUrl = url || window.location.href;

    // Ensure image is absolute URL if possible, otherwise relative to root
    const imageUrl = image.startsWith('http') ? image : `${window.location.origin}${image}`;

    return (
        <Helmet>
            {/* Standard Metadata */}
            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            <html lang={lang} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={currentUrl} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={imageUrl} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:url" content={currentUrl} />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={imageUrl} />

            {/* Other */}
            <meta name="theme-color" content="#a00020" />
            <link rel="canonical" href={currentUrl} />
        </Helmet>
    );
}
