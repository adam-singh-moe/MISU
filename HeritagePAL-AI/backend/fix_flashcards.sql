-- Check if flashcard_sets table exists, if not create it
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

-- Create the flashcard_sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.flashcard_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id),
    session_id TEXT NOT NULL,
    topic_id UUID REFERENCES public.topics(id),
    flashcard_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.flashcard_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcard_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public flashcard sets are viewable by everyone" 
ON public.flashcard_sets FOR SELECT 
USING (user_id IS NULL OR is_ai_generated = false);

CREATE POLICY "Users can view their own flashcard sets" 
ON public.flashcard_sets FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Only authenticated users can insert flashcard sets" 
ON public.flashcard_sets FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can only view their own flashcard sessions" 
ON public.flashcard_sessions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Only authenticated users can insert flashcard sessions" 
ON public.flashcard_sessions FOR INSERT 
WITH CHECK (auth.uid() = user_id); 