import React from 'react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white border border-gray-200 shadow-sm sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              Terms and Services for Trading Card App
            </h1>
            <p className="text-base text-gray-600 mb-8">Last Updated: March 23, 2025</p>

            <div className="space-y-8">
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
                <p className="text-base text-gray-700">
                  By signing up for or using Trading Card App, you agree to be bound by these Terms and Services. 
                  If you do not agree, you may not use our services.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">2. User-Uploaded Content</h2>
                <p className="text-base text-gray-700">
                  By uploading images or data (e.g., card details) to Trading Card App, you grant us a non-exclusive, 
                  worldwide, royalty-free license to use, display, and distribute that content in connection with our 
                  services. You represent and warrant that you own or have the necessary rights to upload and grant 
                  this license for all content you upload, and that it does not infringe on the intellectual property 
                  rights of others.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">3. User Responsibilities</h2>
                <p className="text-base text-gray-700">
                  You agree to use Trading Card App in compliance with all applicable laws and not to upload any 
                  content that infringes on the intellectual property rights of others.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Limitation of Liability</h2>
                <p className="text-base text-gray-700">
                  Trading Card App is not liable for any damages, claims, or losses arising from your use of the app 
                  or content uploaded by other users.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Changes to Terms</h2>
                <p className="text-base text-gray-700">
                  We may update these Terms and Services from time to time. We will notify you of changes by posting 
                  the updated terms on this page.
                </p>
              </section>

              <div className="mt-12 pt-8 border-t border-gray-200">
                <p className="text-base text-gray-600">
                  For questions, contact us at{' '}
                  <a href="mailto:support@tradingcardapp.com" className="text-indigo-600 hover:text-indigo-500">
                    support@tradingcardapp.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 