import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center space-x-6">
          <Link
            href="/terms"
            className="text-sm text-gray-500 hover:text-gray-900"
          >
            Terms and Services
          </Link>
          <span className="text-sm text-gray-500">•</span>
          <Link
            href="mailto:support@tradingcardapp.com"
            className="text-sm text-gray-500 hover:text-gray-900"
          >
            Contact
          </Link>
          <span className="text-sm text-gray-500">•</span>
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Trading Card App. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
} 