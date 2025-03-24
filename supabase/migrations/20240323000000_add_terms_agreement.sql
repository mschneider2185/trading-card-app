-- Add agreed_to_terms and agreed_to_terms_at columns to profiles table
ALTER TABLE profiles
ADD COLUMN agreed_to_terms boolean DEFAULT false,
ADD COLUMN agreed_to_terms_at timestamptz;

-- Create cards table if it doesn't exist
CREATE TABLE IF NOT EXISTS cards (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  player_name text NOT NULL,
  year integer NOT NULL,
  set_name text NOT NULL,
  card_number text NOT NULL,
  condition text NOT NULL,
  front_image_url text,
  back_image_url text,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on cards table
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view their own cards
CREATE POLICY "Users can view their own cards"
  ON cards
  FOR SELECT
  USING (auth.uid() = created_by);

-- Create policy to allow users to insert their own cards
CREATE POLICY "Users can insert their own cards"
  ON cards
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Create policy to allow users to update their own cards
CREATE POLICY "Users can update their own cards"
  ON cards
  FOR UPDATE
  USING (auth.uid() = created_by);

-- Create policy to allow users to delete their own cards
CREATE POLICY "Users can delete their own cards"
  ON cards
  FOR DELETE
  USING (auth.uid() = created_by);

-- Create storage bucket for card images if it doesn't exist
INSERT INTO storage.buckets (id, name)
SELECT 'card-images', 'card-images'
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'card-images'
);

-- Enable RLS on storage bucket
UPDATE storage.buckets
SET public = false
WHERE id = 'card-images';

-- Create policy to allow users to upload images
CREATE POLICY "Users can upload card images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'card-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create policy to allow users to view their own images
CREATE POLICY "Users can view their own card images"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'card-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  ); 