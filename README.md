# Trading Card App

A web application for managing your sports and collectible trading cards collection, built with Next.js and Supabase.

## Features

- User authentication
- Card collection management
- Search functionality
- Profile management
- Responsive design

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn
- A Supabase account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/mschneider2185/trading-card-app.git
cd trading-card-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Copy `.env.example` to `.env.local`
   - Fill in your Supabase URL and anon key from your Supabase project settings
```bash
cp .env.example .env.local
```

4. Run the development server:
```bash
npm run dev
```

The app should now be running at [http://localhost:3000](http://localhost:3000).

## Environment Variables

The following environment variables are required:

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase project anonymous key

Get these values from your Supabase project settings.

## Tech Stack

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [TypeScript](https://www.typescriptlang.org/)

## Features

- **Card Search & Filtering**
  - Search cards by player name, year, or set
  - Filter by condition and price range
  - Server-side fetching for better performance and SEO

- **User Accounts**
  - Email/password authentication
  - Google OAuth login
  - User profiles with customizable usernames

- **Collection Management**
  - Add cards to your collection
  - Track card conditions
  - View and manage your collection

## Deployment

1. Push your code to a Git repository (GitHub, GitLab, etc.)
2. Connect your repository to Vercel
3. Add your environment variables in the Vercel project settings
4. Deploy!

## Future Features

- Price history charts and analytics
- Marketplace for buying/selling cards
- Real-time sale notifications
- Card grading integration
- Collection value tracking
- Card condition photo upload

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
