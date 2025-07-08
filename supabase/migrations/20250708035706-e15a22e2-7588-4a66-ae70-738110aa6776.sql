-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create prompts table
CREATE TABLE public.prompts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create prompt versions table for history
CREATE TABLE public.prompt_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt_id UUID NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  version_number INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create API keys table
CREATE TABLE public.api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,
  last_used TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for projects
CREATE POLICY "Users can view their own projects" 
ON public.projects FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects" 
ON public.projects FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" 
ON public.projects FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" 
ON public.projects FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for prompts
CREATE POLICY "Users can view prompts in their projects" 
ON public.prompts FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = prompts.project_id 
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create prompts in their projects" 
ON public.prompts FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = prompts.project_id 
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update prompts in their projects" 
ON public.prompts FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = prompts.project_id 
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete prompts in their projects" 
ON public.prompts FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = prompts.project_id 
    AND projects.user_id = auth.uid()
  )
);

-- Create RLS policies for prompt versions
CREATE POLICY "Users can view versions of their prompts" 
ON public.prompt_versions FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.prompts p
    JOIN public.projects pr ON p.project_id = pr.id
    WHERE p.id = prompt_versions.prompt_id 
    AND pr.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create versions of their prompts" 
ON public.prompt_versions FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.prompts p
    JOIN public.projects pr ON p.project_id = pr.id
    WHERE p.id = prompt_versions.prompt_id 
    AND pr.user_id = auth.uid()
  )
);

-- Create RLS policies for API keys
CREATE POLICY "Users can view API keys for their projects" 
ON public.api_keys FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = api_keys.project_id 
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create API keys for their projects" 
ON public.api_keys FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = api_keys.project_id 
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete API keys for their projects" 
ON public.api_keys FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = api_keys.project_id 
    AND projects.user_id = auth.uid()
  )
);

-- Public policy for API access to prompts
CREATE POLICY "API access to prompts with valid key" 
ON public.prompts FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.api_keys 
    WHERE api_keys.project_id = prompts.project_id
  )
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_prompts_updated_at
  BEFORE UPDATE ON public.prompts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to create version when prompt is updated
CREATE OR REPLACE FUNCTION public.create_prompt_version()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.prompt_versions (prompt_id, content, variables, version_number)
  VALUES (
    NEW.id,
    OLD.content,
    OLD.variables,
    COALESCE((
      SELECT MAX(version_number) + 1 
      FROM public.prompt_versions 
      WHERE prompt_id = NEW.id
    ), 1)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for prompt versioning
CREATE TRIGGER create_prompt_version_trigger
  AFTER UPDATE ON public.prompts
  FOR EACH ROW
  WHEN (OLD.content IS DISTINCT FROM NEW.content OR OLD.variables IS DISTINCT FROM NEW.variables)
  EXECUTE FUNCTION public.create_prompt_version();