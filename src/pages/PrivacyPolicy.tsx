export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-foreground mb-8">Privacy Policy</h1>
      
      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-4">Information We Collect</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            QuantSuite collects information you provide directly to us, such as when you create an account, 
            use our AI-powered trading models, or contact us for support. This may include your email address, 
            trading preferences, algorithmic strategies, and platform usage analytics.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-4">How We Use Your Information</h2>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Provide and enhance our AI-powered quantitative trading platform</li>
            <li>Process algorithmic calculations and AI model predictions</li>
            <li>Personalize trading signals and market intelligence</li>
            <li>Send you updates about new AI features and market insights</li>
            <li>Respond to your questions and provide technical support</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-4">Data Security & AI Ethics</h2>
          <p className="text-muted-foreground leading-relaxed">
            We implement enterprise-grade security measures to protect your personal information and trading data 
            against unauthorized access, alteration, or disclosure. All AI calculations are performed with strict 
            privacy controls, and your sensitive trading strategies remain confidential and encrypted.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-4">Contact Us</h2>
          <p className="text-muted-foreground leading-relaxed">
            If you have any questions about this Privacy Policy, please contact us at{' '}
            <a 
              href="mailto:anirban_ua2503aih38@iitp.ac.in"
              className="text-primary hover:underline"
            >
              anirban_ua2503aih38@iitp.ac.in
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}