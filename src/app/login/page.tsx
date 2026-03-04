'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import { Radar, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const nextPath = searchParams.get('next') || '/dashboard';
    const urlError = searchParams.get('error');

    useEffect(() => {
        if (urlError === 'auth_callback_failed') {
            setError('Authentication failed. Please try again.');
        }
    }, [urlError]);

    const supabase = getSupabaseBrowserClient();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        try {
            if (mode === 'login') {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                router.push(nextPath);
                router.refresh();
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
                });
                if (error) throw error;
                setMessage('Check your email to confirm your account, then log in!');
                setMode('login');
            }
        } catch (err: unknown) {
            const e = err as { message?: string };
            setError(e.message || 'An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-primary)',
            padding: '24px',
        }}>
            {/* Background gradient orbs */}
            <div style={{
                position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden',
            }}>
                <div style={{
                    position: 'absolute', top: '-20%', left: '-10%',
                    width: 600, height: 600, borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
                }} />
                <div style={{
                    position: 'absolute', bottom: '-20%', right: '-10%',
                    width: 500, height: 500, borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(168,85,247,0.10) 0%, transparent 70%)',
                }} />
            </div>

            <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: 56, height: 56, borderRadius: 16,
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        marginBottom: 16, boxShadow: '0 0 32px rgba(99,102,241,0.4)',
                    }}>
                        <Radar size={28} color="white" />
                    </div>
                    <h1 style={{
                        fontSize: '1.75rem', fontWeight: 800,
                        background: 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.7) 100%)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        margin: 0,
                    }}>
                        CreatorRadar
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 6 }}>
                        {mode === 'login' ? 'Sign in to your workspace' : 'Create your account'}
                    </p>
                </div>

                {/* Card */}
                <div className="glass-card" style={{ padding: 32 }}>
                    {/* Mode Toggle */}
                    <div style={{
                        display: 'flex', background: 'rgba(255,255,255,0.05)',
                        borderRadius: 10, padding: 4, marginBottom: 28,
                    }}>
                        {(['login', 'signup'] as const).map(m => (
                            <button key={m} onClick={() => { setMode(m); setError(''); setMessage(''); }}
                                style={{
                                    flex: 1, padding: '8px 0', border: 'none', cursor: 'pointer',
                                    borderRadius: 8, fontSize: 14, fontWeight: 600, transition: 'all 0.2s',
                                    background: mode === m ? 'rgba(99,102,241,0.3)' : 'transparent',
                                    color: mode === m ? 'white' : 'var(--text-muted)',
                                    boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
                                }}>
                                {m === 'login' ? 'Sign In' : 'Sign Up'}
                            </button>
                        ))}
                    </div>

                    {/* Error / Message */}
                    {error && (
                        <div style={{
                            display: 'flex', alignItems: 'flex-start', gap: 10,
                            padding: '12px 14px', borderRadius: 10, marginBottom: 20,
                            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                        }}>
                            <AlertCircle size={16} color="#f87171" style={{ flexShrink: 0, marginTop: 1 }} />
                            <span style={{ color: '#f87171', fontSize: 13.5 }}>{error}</span>
                        </div>
                    )}
                    {message && (
                        <div style={{
                            padding: '12px 14px', borderRadius: 10, marginBottom: 20,
                            background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
                            color: '#34d399', fontSize: 13.5,
                        }}>
                            {message}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {/* Email */}
                        <div className="settings-field">
                            <label className="label">
                                <Mail size={13} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                                Email Address
                            </label>
                            <input
                                type="email" className="input" placeholder="you@company.com"
                                value={email} onChange={e => setEmail(e.target.value)}
                                required autoComplete="email" autoFocus
                            />
                        </div>

                        {/* Password */}
                        <div className="settings-field">
                            <label className="label">
                                <Lock size={13} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                                Password
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className="input" placeholder={mode === 'signup' ? 'Min. 6 characters' : '••••••••'}
                                    value={password} onChange={e => setPassword(e.target.value)}
                                    required minLength={6} autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                                    style={{ paddingRight: 44 }}
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        color: 'var(--text-muted)', padding: 4,
                                    }}>
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary"
                            disabled={loading}
                            style={{ width: '100%', marginTop: 8, justifyContent: 'center', padding: '12px 20px' }}>
                            {loading
                                ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Processing...</>
                                : <>{mode === 'login' ? 'Sign In' : 'Create Account'} <ArrowRight size={16} /></>
                            }
                        </button>
                    </form>
                </div>

                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12.5, marginTop: 20 }}>
                    By continuing, you agree to the CreatorRadar Terms of Service.
                </p>
            </div>

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={null}>
            <LoginContent />
        </Suspense>
    );
}
