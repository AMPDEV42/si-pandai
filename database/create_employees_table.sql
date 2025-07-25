-- Create Employees Table Migration
-- Run this in your Supabase SQL Editor to create the employees table

-- Enable required extensions (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create employees table
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nip TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  birth_date DATE,
  birth_place TEXT,
  gender TEXT CHECK (gender IN ('L', 'P')),
  
  -- Employment Information
  unit_kerja TEXT NOT NULL,
  position TEXT,
  rank TEXT, -- Golongan/Pangkat
  employee_type TEXT CHECK (employee_type IN ('PNS', 'PPPK', 'Kontrak', 'Honorer')) DEFAULT 'PNS',
  work_start_date DATE,
  
  -- Address Information
  address TEXT,
  city TEXT,
  postal_code TEXT,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'retired')),
  
  -- Education
  last_education TEXT,
  education_major TEXT,
  
  -- Family Information
  marital_status TEXT CHECK (marital_status IN ('single', 'married', 'divorced', 'widowed')),
  spouse_name TEXT,
  children_count INTEGER DEFAULT 0,
  
  -- Additional Information
  photo_url TEXT,
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Add employee_id column to submissions table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'submissions' AND column_name = 'employee_id') THEN
        ALTER TABLE public.submissions 
        ADD COLUMN employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employees_nip ON public.employees(nip);
CREATE INDEX IF NOT EXISTS idx_employees_full_name ON public.employees(full_name);
CREATE INDEX IF NOT EXISTS idx_employees_unit_kerja ON public.employees(unit_kerja);
CREATE INDEX IF NOT EXISTS idx_employees_status ON public.employees(status);

-- Create index on submissions.employee_id if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'submissions' AND column_name = 'employee_id') THEN
        CREATE INDEX IF NOT EXISTS idx_submissions_employee_id ON public.submissions(employee_id);
    END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Everyone can view active employees" ON public.employees;
DROP POLICY IF EXISTS "Admin master can manage all employees" ON public.employees;
DROP POLICY IF EXISTS "Admin unit can view employees in their unit" ON public.employees;

-- RLS Policies for employees
CREATE POLICY "Everyone can view active employees" ON public.employees
  FOR SELECT USING (status = 'active');

CREATE POLICY "Admin master can manage all employees" ON public.employees
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin-master'
    )
  );

CREATE POLICY "Admin unit can view employees in their unit" ON public.employees
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin-unit' 
      AND unit_kerja = employees.unit_kerja
    )
  );

-- Create trigger function for updated_at if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS update_employees_updated_at ON public.employees;
CREATE TRIGGER update_employees_updated_at 
  BEFORE UPDATE ON public.employees 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample employee data from existing profiles
INSERT INTO public.employees (
  id, 
  nip, 
  full_name, 
  email, 
  phone, 
  unit_kerja, 
  position, 
  rank, 
  employee_type, 
  status,
  created_at,
  updated_at
)
SELECT 
  id,
  COALESCE(nip, 'NIP-' || EXTRACT(EPOCH FROM NOW())::text) as nip,
  COALESCE(full_name, email) as full_name,
  email,
  phone,
  COALESCE(unit_kerja, 'Unit Kerja Belum Ditentukan') as unit_kerja,
  'Pegawai' as position,
  'III/a' as rank,
  'PNS' as employee_type,
  'active' as status,
  created_at,
  updated_at
FROM public.profiles
WHERE id NOT IN (SELECT id FROM public.employees)
ON CONFLICT (nip) DO NOTHING;

-- Add some additional sample employees if needed
INSERT INTO public.employees (nip, full_name, email, unit_kerja, position, rank, employee_type, status) VALUES
('199001012010011001', 'Dr. Ahmad Wijaya, S.Kom, M.T', 'ahmad.wijaya@sipandai.app', 'Dinas Komunikasi dan Informatika', 'Kepala Bidang TI', 'IV/a', 'PNS', 'active'),
('199203152012022001', 'Siti Nurhaliza, S.E', 'siti.nurhaliza@sipandai.app', 'Bagian Keuangan', 'Bendahara', 'III/c', 'PNS', 'active'),
('199705102015011002', 'Budi Santoso, S.T', 'budi.santoso@sipandai.app', 'Bagian Umum', 'Staff Umum', 'III/a', 'PNS', 'active'),
('199912252018022003', 'Maria Magdalena, S.Pd', 'maria.magdalena@sipandai.app', 'Dinas Pendidikan', 'Guru', 'III/b', 'PNS', 'active'),
('196505151990031004', 'H. Muhammad Ali, S.H', 'muhammad.ali@sipandai.app', 'Bagian Hukum', 'Kepala Bagian Hukum', 'IV/b', 'PNS', 'active')
ON CONFLICT (nip) DO NOTHING;

-- Update submissions to link with employees (where possible)
UPDATE public.submissions 
SET employee_id = profiles.id
FROM public.profiles
WHERE submissions.submitted_by = profiles.id 
AND submissions.employee_id IS NULL;

-- Show success message
DO $$
BEGIN
  RAISE NOTICE 'Employees table created successfully!';
  RAISE NOTICE 'Sample data inserted from existing profiles.';
  RAISE NOTICE 'You can now use the employee selection feature.';
END $$;
