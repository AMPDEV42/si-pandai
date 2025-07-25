-- SIPANDAI Database Schema
-- Professional database structure for real data implementation

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin-master', 'admin-unit', 'user')),
  unit_kerja TEXT,
  nip TEXT UNIQUE,
  phone TEXT,
  position TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  submission_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'revision')),
  submitted_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  unit_kerja TEXT,
  personal_info JSONB DEFAULT '{}',
  requirements_data JSONB DEFAULT '{}',
  notes TEXT,
  review_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Submission documents table
CREATE TABLE IF NOT EXISTS submission_documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  requirement_id TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Document templates table
CREATE TABLE IF NOT EXISTS document_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  submission_type TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Submission history/audit table
CREATE TABLE IF NOT EXISTS submission_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL,
  old_status TEXT,
  new_status TEXT,
  notes TEXT,
  performed_by UUID REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  performed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_by ON submissions(submitted_by);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at);
CREATE INDEX IF NOT EXISTS idx_submissions_unit_kerja ON submissions(unit_kerja);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_submission_documents_submission_id ON submission_documents(submission_id);
CREATE INDEX IF NOT EXISTS idx_submission_history_submission_id ON submission_history(submission_id);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admin master can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin-master'
    )
  );

-- RLS Policies for submissions
CREATE POLICY "Users can view their own submissions" ON submissions
  FOR SELECT USING (
    submitted_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin-master', 'admin-unit')
    )
  );

CREATE POLICY "Users can create submissions" ON submissions
  FOR INSERT WITH CHECK (submitted_by = auth.uid());

CREATE POLICY "Users can update their own submissions when pending" ON submissions
  FOR UPDATE USING (
    submitted_by = auth.uid() AND status = 'pending'
  );

CREATE POLICY "Admins can update any submission" ON submissions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin-master', 'admin-unit')
    )
  );

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for submission documents
CREATE POLICY "Users can view documents for accessible submissions" ON submission_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM submissions s
      WHERE s.id = submission_id AND (
        s.submitted_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() AND role IN ('admin-master', 'admin-unit')
        )
      )
    )
  );

CREATE POLICY "Users can upload documents for their submissions" ON submission_documents
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM submissions s
      WHERE s.id = submission_id AND s.submitted_by = auth.uid()
    )
  );

-- RLS Policies for document templates
CREATE POLICY "Everyone can view active templates" ON document_templates
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admin master can manage templates" ON document_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin-master'
    )
  );

-- RLS Policies for submission history
CREATE POLICY "Users can view history for accessible submissions" ON submission_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM submissions s
      WHERE s.id = submission_id AND (
        s.submitted_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() AND role IN ('admin-master', 'admin-unit')
        )
      )
    )
  );

CREATE POLICY "System can create history entries" ON submission_history
  FOR INSERT WITH CHECK (performed_by = auth.uid());

-- Functions and triggers for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_submissions_updated_at 
  BEFORE UPDATE ON submissions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_templates_updated_at 
  BEFORE UPDATE ON document_templates 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to create submission history entries
CREATE OR REPLACE FUNCTION create_submission_history()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO submission_history (submission_id, action, new_status, performed_by)
    VALUES (NEW.id, 'created', NEW.status, NEW.submitted_by);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    INSERT INTO submission_history (submission_id, action, old_status, new_status, notes, performed_by)
    VALUES (NEW.id, 'status_changed', OLD.status, NEW.status, NEW.review_notes, NEW.reviewed_by);
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for submission history
CREATE TRIGGER submission_history_trigger
  AFTER INSERT OR UPDATE ON submissions
  FOR EACH ROW EXECUTE FUNCTION create_submission_history();

-- Sample admin user (you should update this with your actual admin credentials)
-- INSERT INTO auth.users (email, encrypted_password) VALUES ('admin@sipandai.app', crypt('admin123', gen_salt('bf')));
