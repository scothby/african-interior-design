import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

const SEO = ({ title, description, image, type = 'website' }) => {
    const { i18n } = useTranslation();
    const lang = i18n.language || 'fr';

    const siteName = 'African Interior Design';
    const fullTitle = title ? `${title} | ${siteName}` : siteName;
    const defaultDesc = 'Explorez l\'excellence de l\'architecture et du design d\'intérieur africain. Base de données de styles authentiques et studio de création IA.';
    const metaDescription = description || defaultDesc;
    const url = window.location.href;
    const defaultImage = `${window.location.origin}/og-image.png`;
    const ogImage = image || defaultImage;

    return (
        <Helmet>
            {/* Basic Meta Tags */}
            <html lang={lang} />
            <title>{fullTitle}</title>
            <meta name="description" content={metaDescription} />
            <link rel="canonical" href={url} />

            {/* Multilingual Support */}
            <link rel="alternate" href={`${window.location.origin}/fr`} hreflang="fr" />
            <link rel="alternate" href={`${window.location.origin}/en`} hreflang="en" />
            <link rel="alternate" href={window.location.origin} hreflang="x-default" />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={url} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={metaDescription} />
            <meta property="og:image" content={ogImage} />
            <meta property="og:site_name" content={siteName} />

            {/* Twitter */}
            <meta property="twitter:card" content="summary_large_image" />
            <meta property="twitter:url" content={url} />
            <meta property="twitter:title" content={fullTitle} />
            <meta property="twitter:description" content={metaDescription} />
            <meta property="twitter:image" content={ogImage} />
        </Helmet>
    );
};

export default SEO;
