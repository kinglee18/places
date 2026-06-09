'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { useTransition } from 'react';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const t = useTranslations('LanguageSwitcher');

  const switchLocale = (next: 'en' | 'es') => {
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  };

  return (
    <div style={{ display: 'flex', gap: '2px', background: 'oklch(0.93 0.01 250)', borderRadius: '8px', padding: '3px' }}>
      {(['en', 'es'] as const).map((l) => (
        <button
          key={l}
          onClick={() => switchLocale(l)}
          disabled={isPending || locale === l}
          style={{
            fontSize: '12px',
            fontWeight: locale === l ? 700 : 500,
            color: locale === l ? 'oklch(0.235 0.07 265)' : 'oklch(0.45 0.03 260)',
            background: locale === l ? 'white' : 'transparent',
            border: 'none',
            borderRadius: '5px',
            padding: '3px 8px',
            cursor: locale === l ? 'default' : 'pointer',
            fontFamily: "'DM Mono', monospace",
            transition: 'all 0.15s',
            boxShadow: locale === l ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            letterSpacing: '0.04em',
          }}
        >
          {t(l)}
        </button>
      ))}
    </div>
  );
}
