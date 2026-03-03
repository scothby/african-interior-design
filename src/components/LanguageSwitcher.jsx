import React from 'react';
import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
    const { i18n } = useTranslation();

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    return (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
                onClick={() => changeLanguage('fr')}
                style={{
                    background: i18n.language === 'fr' ? 'rgba(184, 134, 11, 0.2)' : 'transparent',
                    border: i18n.language === 'fr' ? '1px solid #B8860B' : '1px solid rgba(184, 134, 11, 0.3)',
                    color: i18n.language === 'fr' ? '#B8860B' : '#8B7050',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    transition: 'all 0.2s'
                }}
            >
                FR
            </button>
            <button
                onClick={() => changeLanguage('en')}
                style={{
                    background: i18n.language === 'en' ? 'rgba(184, 134, 11, 0.2)' : 'transparent',
                    border: i18n.language === 'en' ? '1px solid #B8860B' : '1px solid rgba(184, 134, 11, 0.3)',
                    color: i18n.language === 'en' ? '#B8860B' : '#8B7050',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    transition: 'all 0.2s'
                }}
            >
                EN
            </button>
        </div>
    );
}
