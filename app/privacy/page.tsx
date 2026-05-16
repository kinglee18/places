import Link from 'next/link';

export const metadata = { title: 'Privacy Policy — LocalIQ' };

export default function PrivacyPage() {
  return (
    <main style={{ minHeight: '100vh', padding: '80px 24px', maxWidth: '760px', margin: '0 auto' }}>
      <Link href="/" style={{ fontSize: '14px', color: '#6b6b9a', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '40px' }}>
        ← Back to home
      </Link>

      <h1 style={{ fontSize: '36px', fontWeight: 900, marginBottom: '8px' }}>Privacy Policy</h1>
      <p style={{ color: '#6b6b9a', fontSize: '14px', marginBottom: '48px' }}>Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', color: '#c0c0d8', lineHeight: 1.75, fontSize: '15px' }}>
        <section>
          <h2 style={{ color: '#f0f0f8', fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>1. Information We Collect</h2>
          <p>We collect information you provide when registering a property (address, photos, price), as well as authentication data from Google OAuth (name, email, profile picture). We do not store your Google password.</p>
        </section>

        <section>
          <h2 style={{ color: '#f0f0f8', fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>2. How We Use Your Information</h2>
          <p>Your data is used to display property listings, generate market analysis reports, and personalize your experience. We do not sell your personal data to third parties.</p>
        </section>

        <section>
          <h2 style={{ color: '#f0f0f8', fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>3. Data Storage</h2>
          <p>Property data and photos are stored securely using Supabase infrastructure. Authentication tokens are managed by NextAuth.js and stored in secure, HTTP-only cookies.</p>
        </section>

        <section>
          <h2 style={{ color: '#f0f0f8', fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>4. Third-Party Services</h2>
          <p>We use the following third-party services: Google (authentication), Supabase (data storage), and Stripe (payment processing). Each service has its own privacy policy.</p>
        </section>

        <section>
          <h2 style={{ color: '#f0f0f8', fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>5. Your Rights</h2>
          <p>You may request deletion of your account and all associated data at any time by contacting us. Property listings will be removed from public view upon account deletion.</p>
        </section>

        <section>
          <h2 style={{ color: '#f0f0f8', fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>6. Contact</h2>
          <p>For privacy-related questions, contact us at <a href="mailto:hello@localiq.app" style={{ color: '#00f5a0' }}>hello@localiq.app</a>.</p>
        </section>
      </div>
    </main>
  );
}
