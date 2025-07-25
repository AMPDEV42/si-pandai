-- Employee Table Schema
-- This table stores employee data for submissions

CREATE TABLE IF NOT EXISTS employees (
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
  employee_type TEXT CHECK (employee_type IN ('PNS', 'PPPK', 'Kontrak', 'Honorer')),
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
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Add employee_id to submissions table
ALTER TABLE submissions 
ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES employees(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employees_nip ON employees(nip);
CREATE INDEX IF NOT EXISTS idx_employees_full_name ON employees(full_name);
CREATE INDEX IF NOT EXISTS idx_employees_unit_kerja ON employees(unit_kerja);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_submissions_employee_id ON submissions(employee_id);

-- Enable Row Level Security
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- RLS Policies for employees
CREATE POLICY "Everyone can view active employees" ON employees
  FOR SELECT USING (status = 'active');

CREATE POLICY "Admin master can manage all employees" ON employees
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin-master'
    )
  );

CREATE POLICY "Admin unit can view employees in their unit" ON employees
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin-unit' 
      AND unit_kerja = employees.unit_kerja
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_employees_updated_at 
  BEFORE UPDATE ON employees 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data (you can customize this)
INSERT INTO employees (nip, full_name, email, unit_kerja, position, rank, employee_type, status) VALUES
('199001012010011001', 'Dr. Ahmad Wijaya, S.Kom, M.T', 'ahmad.wijaya@example.com', 'Dinas Komunikasi dan Informatika', 'Kepala Bidang TI', 'IV/a', 'PNS', 'active'),
('199203152012022001', 'Siti Nurhaliza, S.E', 'siti.nurhaliza@example.com', 'Bagian Keuangan', 'Bendahara', 'III/c', 'PNS', 'active'),
('199705102015011002', 'Budi Santoso, S.T', 'budi.santoso@example.com', 'Bagian Umum', 'Staff Umum', 'III/a', 'PNS', 'active'),
('199912252018022003', 'Maria Magdalena, S.Pd', 'maria.magdalena@example.com', 'Dinas Pendidikan', 'Guru', 'III/b', 'PNS', 'active'),
('196505151990031004', 'H. Muhammad Ali, S.H', 'muhammad.ali@example.com', 'Bagian Hukum', 'Kepala Bagian Hukum', 'IV/b', 'PNS', 'active')
ON CONFLICT (nip) DO NOTHING;
