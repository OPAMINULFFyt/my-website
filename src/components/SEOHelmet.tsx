import React, { useEffect, useState } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { supabase } from '../lib/supabase';

interface SEOHelmetProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
}

export const SEOHelmet: React.FC<SEOHelmetProps> = ({ 
  title, 
  description, 
  keywords, 
  image, 
  url 
}) => {
  const [settings, setSettings] = useState({
    site_name: 'OP AMINUL FF',
    meta_title: 'OP AMINUL FF - Digital Asset Marketplace',
    meta_description: 'Buy and sell premium digital assets, courses, and hardware kits.',
    meta_keywords: 'gaming, assets, development, courses, scripts',
    site_logo: '',
    site_favicon: '',
    google_verification: ''
  });

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from('settings').select('*');
      if (data) {
        const settingsMap = data.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {} as any);
        setSettings({
          site_name: settingsMap.site_name || 'OP AMINUL FF',
          meta_title: settingsMap.meta_title || 'OP AMINUL FF - Digital Asset Marketplace',
          meta_description: settingsMap.meta_description || 'Buy and sell premium digital assets, courses, and hardware kits.',
          meta_keywords: settingsMap.meta_keywords || 'gaming, assets, development, courses, scripts',
          site_logo: settingsMap.site_logo || '',
          site_favicon: settingsMap.site_favicon || '',
          google_verification: settingsMap.google_verification || ''
        });
      }
    };
    fetchSettings();
  }, []);

  const finalTitle = title ? `${title} | ${settings.site_name}` : settings.meta_title;
  const finalDescription = description || settings.meta_description;
  const finalKeywords = keywords || settings.meta_keywords;
  const finalImage = image || settings.site_logo;
  const finalUrl = url || window.location.href;

  // Update favicon dynamically
  useEffect(() => {
    if (settings.site_favicon) {
      const link: HTMLLinkElement = document.querySelector("link[rel*='icon']") || document.createElement('link');
      link.type = 'image/x-icon';
      link.rel = 'shortcut icon';
      link.href = settings.site_favicon;
      document.getElementsByTagName('head')[0].appendChild(link);
    }
  }, [settings.site_favicon]);

  return (
    <Helmet>
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      <meta name="keywords" content={finalKeywords} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={finalUrl} />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={finalImage} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={finalUrl} />
      <meta property="twitter:title" content={finalTitle} />
      <meta property="twitter:description" content={finalDescription} />
      <meta property="twitter:image" content={finalImage} />

      {/* Google Search Console */}
      {settings.google_verification && (
        <meta name="google-site-verification" content={settings.google_verification} />
      )}
    </Helmet>
  );
};

export { HelmetProvider };
