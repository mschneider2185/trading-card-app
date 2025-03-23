# Card Trader - Sports & Collectible Trading Cards App

A Next.js application for managing and tracking sports and collectible trading cards. Built with Next.js, Supabase, and Tailwind CSS.

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

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (Database, Authentication, Storage)
- **Deployment**: Vercel

## Prerequisites

- Node.js 18.17 or later
- npm or yarn
- Supabase account and project

## Getting Started

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd my-trading-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

4. Set up your Supabase database with the following tables:

   **profiles**
   ```sql
   create table profiles (
     id uuid references auth.users on delete cascade,
     username text unique,
     updated_at timestamp with time zone,
     primary key (id)
   );
   ```

   **cards**
   ```sql
   create table cards (
     id uuid default uuid_generate_v4() primary key,
     name text not null,
     year integer not null,
     set text not null,
     condition text not null,
     price decimal not null,
     image_url text not null,
     created_at timestamp with time zone default timezone('utc'::text, now())
   );
   ```

   **collections**
   ```sql
   create table collections (
     id uuid default uuid_generate_v4() primary key,
     user_id uuid references auth.users on delete cascade,
     card_id uuid references cards on delete cascade,
     condition text not null,
     added_at timestamp with time zone default timezone('utc'::text, now()),
     unique(user_id, card_id)
   );
   ```

5. Set up Row Level Security (RLS) policies in Supabase:

   **profiles**
   ```sql
   create policy "Public profiles are viewable by everyone"
     on profiles for select
     using ( true );

   create policy "Users can insert their own profile"
     on profiles for insert
     with check ( auth.uid() = id );

   create policy "Users can update own profile"
     on profiles for update
     using ( auth.uid() = id );
   ```

   **cards**
   ```sql
   create policy "Cards are viewable by everyone"
     on cards for select
     using ( true );
   ```

   **collections**
   ```sql
   create policy "Users can view own collection"
     on collections for select
     using ( auth.uid() = user_id );

   create policy "Users can insert own collection"
     on collections for insert
     with check ( auth.uid() = user_id );

   create policy "Users can update own collection"
     on collections for update
     using ( auth.uid() = user_id );

   create policy "Users can delete own collection"
     on collections for delete
     using ( auth.uid() = user_id );
   ```

6. Run the development server:
   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

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
