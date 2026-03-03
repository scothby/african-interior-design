import { useState } from 'react';
import { useAuth } from './AuthContext';
import { useTranslation } from 'react-i18next';


export default function AuthPage({ onSuccess }) {
    const { t } = useTranslation();
    const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();
    const [mode, setMode] = useState('login'); // 'login' | 'register'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (mode === 'register' && password !== confirmPassword) {
            setError(t('auth.errors.passwordMismatch'));
            return;
        }
        if (password.length < 6) {
            setError(t('auth.errors.passwordLength'));
            return;
        }

        setLoading(true);
        try {
            if (mode === 'login') {
                await signInWithEmail(email, password);
            } else {
                await signUpWithEmail(email, password);
                setSuccess(t('auth.success.created'));
            }
        } catch (err) {
            const msg = err.message || t('auth.errors.general');
            if (msg.includes('Invalid login credentials')) setError(t('auth.errors.invalidCredentials'));
            else if (msg.includes('already registered')) setError(t('auth.errors.emailInUse'));
            else setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogle = async () => {
        setError(null);
        setGoogleLoading(true);
        try {
            await signInWithGoogle();
        } catch (err) {
            setError(err.message || t('auth.errors.googleExt'));
            setGoogleLoading(false);
        }
    };

    return (
        <div style={s.overlay}>
            {/* Background decorative elements */}
            <div style={s.bgCircle1} />
            <div style={s.bgCircle2} />
            <div style={s.bgPattern} />

            <div style={s.card}>
                {/* Logo / Title */}
                <div style={s.logoArea}>
                    <div style={s.logoIcon}>🏺</div>
                    <div style={s.logoTitle}>{t('auth.tagline')}</div>
                    <div style={s.logoSubtitle}>{t('auth.title')}</div>
                </div>

                {/* Tabs */}
                <div style={s.tabs}>
                    <button
                        onClick={() => { setMode('login'); setError(null); setSuccess(null); }}
                        style={{ ...s.tab, ...(mode === 'login' ? s.tabActive : {}) }}
                    >{t('auth.login')}</button>
                    <button
                        onClick={() => { setMode('register'); setError(null); setSuccess(null); }}
                        style={{ ...s.tab, ...(mode === 'register' ? s.tabActive : {}) }}
                    >{t('auth.createAccount')}</button>
                </div>

                <form onSubmit={handleSubmit} style={s.form}>
                    {/* Email */}
                    <div style={s.fieldGroup}>
                        <label style={s.label}>{t('auth.email')}</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            placeholder={t('auth.emailPlaceholder')}
                            style={s.input}
                            autoComplete="email"
                        />
                    </div>

                    {/* Password */}
                    <div style={s.fieldGroup}>
                        <label style={s.label}>{t('auth.password')}</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            placeholder={t('auth.passwordPlaceholder')}
                            style={s.input}
                            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                        />
                    </div>

                    {/* Confirm Password (register only) */}
                    {mode === 'register' && (
                        <div style={s.fieldGroup}>
                            <label style={s.label}>{t('auth.confirmPassword')}</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                required
                                placeholder={t('auth.passwordPlaceholder')}
                                style={s.input}
                                autoComplete="new-password"
                            />
                        </div>
                    )}

                    {/* Error / Success messages */}
                    {error && (
                        <div style={s.errorMsg}>
                            <span>⚠️</span> {error}
                        </div>
                    )}
                    {success && (
                        <div style={s.successMsg}>
                            <span>✅</span> {success}
                        </div>
                    )}

                    {/* Submit */}
                    <button type="submit" disabled={loading} style={{ ...s.submitBtn, opacity: loading ? 0.7 : 1 }}>
                        {loading ? t('auth.loading') : mode === 'login' ? t('auth.btnLogin') : t('auth.btnCreate')}
                    </button>
                </form>

                {/* Divider */}
                <div style={s.divider}>
                    <div style={s.dividerLine} />
                    <span style={s.dividerText}>{t('auth.or')}</span>
                    <div style={s.dividerLine} />
                </div>

                {/* Google OAuth */}
                <button
                    onClick={handleGoogle}
                    disabled={googleLoading}
                    style={{ ...s.googleBtn, opacity: googleLoading ? 0.7 : 1 }}
                >
                    <svg width="18" height="18" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    </svg>
                    {googleLoading ? t('auth.googleRedirect') : t('auth.googleBtn')}
                </button>

                <p style={s.footer}>
                    {t('auth.secureText')}
                </p>
            </div>
        </div>
    );
}

const s = {
    overlay: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0C0806 0%, #1A0F05 50%, #0C0806 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Georgia', serif",
    },
    bgCircle1: {
        position: 'absolute',
        width: '500px', height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(184,134,11,0.08) 0%, transparent 70%)',
        top: '-100px', right: '-100px',
        pointerEvents: 'none',
    },
    bgCircle2: {
        position: 'absolute',
        width: '400px', height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(184,134,11,0.05) 0%, transparent 70%)',
        bottom: '-80px', left: '-80px',
        pointerEvents: 'none',
    },
    bgPattern: {
        position: 'absolute', inset: 0,
        backgroundImage: `repeating-linear-gradient(45deg, rgba(184,134,11,0.02) 0px, rgba(184,134,11,0.02) 1px, transparent 1px, transparent 40px)`,
        pointerEvents: 'none',
    },
    card: {
        position: 'relative',
        background: 'rgba(22, 14, 7, 0.95)',
        border: '1px solid rgba(184,134,11,0.25)',
        borderRadius: '24px',
        padding: '40px',
        width: '100%',
        maxWidth: '440px',
        boxShadow: '0 30px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(184,134,11,0.1)',
        backdropFilter: 'blur(20px)',
    },
    logoArea: { textAlign: 'center', marginBottom: '32px' },
    logoIcon: { fontSize: '48px', marginBottom: '12px', lineHeight: 1 },
    logoTitle: {
        fontSize: '24px', fontWeight: 'bold', color: '#F0E6D3',
        letterSpacing: '0.05em', marginBottom: '4px',
    },
    logoSubtitle: { fontSize: '13px', color: '#B8860B', letterSpacing: '0.15em', textTransform: 'uppercase' },
    tabs: {
        display: 'flex', gap: '4px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '12px', padding: '4px',
        marginBottom: '28px',
    },
    tab: {
        flex: 1, padding: '10px', border: 'none',
        background: 'transparent', color: '#8B7050',
        borderRadius: '8px', cursor: 'pointer',
        fontSize: '14px', fontWeight: '600',
        fontFamily: 'inherit', transition: 'all 0.2s',
    },
    tabActive: { background: '#B8860B', color: '#0C0806', boxShadow: '0 2px 8px rgba(184,134,11,0.4)' },
    form: { display: 'flex', flexDirection: 'column', gap: '18px' },
    fieldGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
    label: { fontSize: '12px', color: '#8B7050', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase' },
    input: {
        padding: '12px 16px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(184,134,11,0.2)',
        borderRadius: '10px', color: '#F0E6D3',
        fontSize: '15px', fontFamily: 'inherit',
        outline: 'none', transition: 'border-color 0.2s',
    },
    errorMsg: {
        background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)',
        borderRadius: '8px', padding: '10px 14px',
        color: '#ff9090', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px',
    },
    successMsg: {
        background: 'rgba(52,199,89,0.1)', border: '1px solid rgba(52,199,89,0.3)',
        borderRadius: '8px', padding: '10px 14px',
        color: '#5dde88', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px',
    },
    submitBtn: {
        padding: '14px',
        background: 'linear-gradient(135deg, #B8860B, #D4A017)',
        border: 'none', borderRadius: '12px',
        color: '#0C0806', fontSize: '15px', fontWeight: 'bold',
        cursor: 'pointer', fontFamily: 'inherit',
        transition: 'all 0.2s',
        boxShadow: '0 4px 16px rgba(184,134,11,0.35)',
        marginTop: '4px',
    },
    divider: { display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' },
    dividerLine: { flex: 1, height: '1px', background: 'rgba(184,134,11,0.15)' },
    dividerText: { color: '#8B7050', fontSize: '12px', letterSpacing: '0.08em' },
    googleBtn: {
        width: '100%', padding: '14px',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '12px', color: '#F0E6D3',
        fontSize: '15px', fontWeight: '600',
        cursor: 'pointer', fontFamily: 'inherit',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
        transition: 'all 0.2s',
    },
    footer: { textAlign: 'center', color: '#4A3520', fontSize: '12px', marginTop: '20px', marginBottom: 0 },
};
