-- Create feedback table for storing user responses
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  satisfied BOOLEAN NOT NULL,
  thoughts TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can submit feedback" ON public.feedback;
DROP POLICY IF EXISTS "Allow all operations on feedback" ON public.feedback;

-- Create policies for feedback (allow public insert, admin read)
CREATE POLICY "Anyone can submit feedback" 
ON public.feedback 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow all operations on feedback" 
ON public.feedback 
FOR ALL 
USING (true);

-- Create questions table for admin to manage questions
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_text TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for questions
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations on questions" ON public.questions;

-- Create policies for questions
CREATE POLICY "Allow all operations on questions" 
ON public.questions 
FOR ALL 
USING (true);

-- Add trigger for questions updated_at if not exists
DROP TRIGGER IF EXISTS update_questions_updated_at ON public.questions;
CREATE TRIGGER update_questions_updated_at
BEFORE UPDATE ON public.questions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default question if not exists
INSERT INTO public.questions (question_text) 
SELECT 'Are you satisfied with Vibe Tech course?'
WHERE NOT EXISTS (SELECT 1 FROM public.questions WHERE question_text = 'Are you satisfied with Vibe Tech course?');