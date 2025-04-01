-- Create the flashcard_sets table if it doesn't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.flashcard_sets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    topic_id UUID REFERENCES public.topics(id),
    grade INTEGER CHECK (grade >= 1 AND grade <= 6),
    user_id UUID REFERENCES public.users(id),
    is_ai_generated BOOLEAN DEFAULT false,
    flashcards JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.flashcard_sets ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY IF NOT EXISTS "Public flashcard sets are viewable by everyone" 
ON public.flashcard_sets FOR SELECT 
USING (user_id IS NULL OR is_ai_generated = false);

CREATE POLICY IF NOT EXISTS "Users can view their own flashcard sets" 
ON public.flashcard_sets FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Only authenticated users can insert flashcard sets" 
ON public.flashcard_sets FOR INSERT 
WITH CHECK (auth.role() = 'authenticated'); 