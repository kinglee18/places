import Link from 'next/link';

export const metadata = { title: 'Terms of Service — LocalIQ' };

export default function TermsPage() {
  return (
    <main style={{ minHeight: '100vh', padding: '80px 24px', maxWidth: '760px', margin: '0 auto' }}>
      <Link href="/" style={{ fontSize: '14px', color: '#6b6b9a', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '40px' }}>
        ← Back to home
      </Link>

      <h1 style={{ fontSize: '36px', fontWeight: 900, marginBottom: '8px' }}>Terms of Service</h1>
      <p style={{ color: '#6b6b9a', fontSize: '14px', marginBottom: '48px' }}>Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', color: '#c0c0d8', lineHeight: 1.75, fontSize: '15px' }}>
        <section>
          <h2 style={{ color: '#f0f0f8', fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>1. Acceptance of Terms</h2>
          <p>By accessing or using LocalIQ, you agree to be bound by these Terms of Service. If you do not agree, please do not use the platform.</p>
        </section>

        <section>
          <h2 style={{ color: '#f0f0f8', fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>2. Use of the Platform</h2>
          <p>LocalIQ allows property owners to register and list commercial properties. You are responsible for the accuracy of the information you provide. You may not use the platform for any unlawful purpose.</p>
        </section>

        <section>
          <h2 style={{ color: '#f0f0f8', fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>3. Intellectual Property</h2>
          <p>All content, trademarks, and data on this platform are the property of LocalIQ or its licensors. You may not reproduce or redistribute any part of this platform without written permission.</p>
        </section>

        <section>
          <h2 style={{ color: '#f0f0f8', fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>4. Limitation of Liability</h2>
          <p>LocalIQ provides information on an &quot;as is&quot; basis. We do not guarantee the accuracy of market analysis or AI recommendations. Use this information as one factor among many in your decision-making process.</p>
        </section>

        <section>
          <h2 style={{ color: '#f0f0f8', fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>5. Changes to Terms</h2>
          <p>We reserve the right to modify these terms at any time. Continued use of the platform after changes constitutes acceptance of the new terms.</p>
        </section>

        <section>
          <h2 style={{ color: '#f0f0f8', fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>6. Contact</h2>
          <p>For questions about these terms, please contact us at <a href="mailto:hello@localiq.app" style={{ color: '#00f5a0' }}>hello@localiq.app</a>.</p>
        </section>
      </div>
    </main>
  );
}
