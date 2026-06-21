'use client';

import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { signUpWithEmail } from '@/app/actions/auth';

interface SignupFormValues {
  email: string;
  password: string;
  confirmPassword: string;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#13132a',
  border: '1px solid #2a2a45',
  borderRadius: '10px',
  padding: '12px 14px',
  fontSize: '15px',
  color: '#f0f0f8',
  fontFamily: "'Inter', sans-serif",
  outline: 'none',
  boxSizing: 'border-box',
};

export default function SignupPage() {
  const t = useTranslations('SignupPage');
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { register, handleSubmit, watch, formState: { errors } } = useForm<SignupFormValues>();
  const password = watch('password');

  async function onSubmit(values: SignupFormValues) {
    setServerError('');
    setLoading(true);

    const result = await signUpWithEmail(values.email, values.password);

    if ('error' in result) {
      setLoading(false);
      if (result.error === 'email_exists') {
        setServerError(t('emailAlreadyExists'));
      } else {
        setServerError(t('unknownError'));
      }
      return;
    }

    const signInResult = await signIn('credentials', {
      email: values.email,
      password: values.password,
      callbackUrl: '/registro',
      redirect: false,
    });

    setLoading(false);

    if (signInResult?.ok) {
      router.push('/registro');
    } else {
      setServerError(t('unknownError'));
    }
  }

  return (
    <main style={{
      minHeight: '100vh',
      background: '#06060f',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter', sans-serif",
      color: '#f0f0f8',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background blobs */}
      <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translate(-50%,-50%)', width: '700px', height: '500px', background: 'radial-gradient(ellipse, rgba(0,245,160,0.06) 0%, transparent 65%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(124,58,237,0.07) 0%, transparent 65%)', pointerEvents: 'none' }} />

      {/* Card */}
      <div style={{
        background: '#0d0d1a',
        border: '1px solid #1e1e35',
        borderRadius: '24px',
        padding: '48px 40px',
        width: '100%',
        maxWidth: '420px',
        textAlign: 'center',
        position: 'relative',
        zIndex: 1,
        boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '32px' }}>
          <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg, #00f5a0, #00b4d8)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', boxShadow: '0 4px 16px rgba(0,245,160,0.3)' }}>
            📍
          </div>
          <span style={{ fontSize: '22px', fontWeight: 800 }}>
            Local<span style={{ color: 'oklch(0.55 0.11 250)' }}>IQ</span>
          </span>
        </div>

        {/* Heading */}
        <h1 style={{ fontSize: '26px', fontWeight: 900, marginBottom: '10px', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
          {t('title')}
        </h1>
        <p style={{ color: 'oklch(0.45 0.03 260)', fontSize: '15px', marginBottom: '32px', lineHeight: 1.6 }}>
          {t('subtitle')}
        </p>

        {/* Sign up form */}
        <form onSubmit={handleSubmit(onSubmit)} style={{ textAlign: 'left' }}>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'oklch(0.55 0.05 260)', marginBottom: '6px', letterSpacing: '0.05em' }}>
              {t('emailLabel').toUpperCase()}
            </label>
            <input
              type="email"
              autoComplete="email"
              style={{ ...inputStyle, borderColor: errors.email ? '#f87171' : '#2a2a45' }}
              {...register('email', { required: true })}
            />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'oklch(0.55 0.05 260)', marginBottom: '6px', letterSpacing: '0.05em' }}>
              {t('passwordLabel').toUpperCase()}
            </label>
            <input
              type="password"
              autoComplete="new-password"
              style={{ ...inputStyle, borderColor: errors.password ? '#f87171' : '#2a2a45' }}
              {...register('password', { required: true, minLength: 8 })}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'oklch(0.55 0.05 260)', marginBottom: '6px', letterSpacing: '0.05em' }}>
              {t('confirmPasswordLabel').toUpperCase()}
            </label>
            <input
              type="password"
              autoComplete="new-password"
              style={{ ...inputStyle, borderColor: errors.confirmPassword ? '#f87171' : '#2a2a45' }}
              {...register('confirmPassword', {
                required: true,
                validate: (value) => value === password || t('passwordMismatch'),
              })}
            />
            {errors.confirmPassword && (
              <p style={{ color: '#f87171', fontSize: '12px', marginTop: '6px' }}>
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {serverError && (
            <p style={{ color: '#f87171', fontSize: '13px', marginBottom: '16px', textAlign: 'center' }}>
              {serverError}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #00f5a0, #00b4d8)',
              color: '#06060f',
              border: 'none',
              borderRadius: '12px',
              padding: '14px 20px',
              fontSize: '15px',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: "'Inter', sans-serif",
              opacity: loading ? 0.7 : 1,
              transition: 'all 0.2s',
            }}
          >
            {loading ? '...' : t('createAccount')}
          </button>
        </form>

        {/* Sign in link */}
        <p style={{ marginTop: '24px', fontSize: '14px', color: 'oklch(0.45 0.03 260)' }}>
          {t('alreadyHaveAccount')}{' '}
          <Link href="/login" style={{ color: '#00f5a0', fontWeight: 600, textDecoration: 'none' }}>
            {t('signInLink')}
          </Link>
        </p>

        {/* Footer note */}
        <p style={{ marginTop: '16px', fontSize: '12px', color: 'oklch(0.45 0.03 260)', lineHeight: 1.6 }}>
          {t('termsNote')}
        </p>

        {/* Back link */}
        <div style={{ marginTop: '28px', paddingTop: '24px', borderTop: '1px solid #1e1e35' }}>
          <Link href="/" style={{ color: 'oklch(0.45 0.03 260)', fontSize: '14px', transition: 'color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'oklch(0.55 0.11 250)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'oklch(0.45 0.03 260)')}>
            {t('backToHome')}
          </Link>
        </div>
      </div>
    </main>
  );
}
