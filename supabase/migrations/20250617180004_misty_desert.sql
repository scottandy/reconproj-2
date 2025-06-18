-- Create dealerships table
CREATE TABLE IF NOT EXISTS dealerships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  zip_code text NOT NULL,
  phone text NOT NULL,
  email text UNIQUE NOT NULL,
  website text,
  is_active boolean DEFAULT true,
  subscription_plan text DEFAULT 'basic' CHECK (subscription_plan IN ('basic', 'premium', 'enterprise')),
  settings jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  initials text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'manager', 'technician', 'sales')),
  dealership_id uuid REFERENCES dealerships(id) ON DELETE CASCADE,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_login timestamptz
);

-- Create vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vin text UNIQUE NOT NULL,
  year integer NOT NULL,
  make text NOT NULL,
  model text NOT NULL,
  trim text,
  mileage integer NOT NULL DEFAULT 0,
  color text NOT NULL,
  date_acquired date NOT NULL,
  target_sale_date date,
  price numeric(10,2) NOT NULL DEFAULT 0,
  location text NOT NULL,
  status jsonb DEFAULT '{}',
  notes text,
  team_notes jsonb DEFAULT '[]',
  is_sold boolean DEFAULT false,
  is_pending boolean DEFAULT false,
  dealership_id uuid REFERENCES dealerships(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  company text,
  title text,
  phone text NOT NULL,
  email text,
  address text,
  city text,
  state text,
  zip_code text,
  category text NOT NULL,
  specialties text[] DEFAULT '{}',
  notes text,
  is_favorite boolean DEFAULT false,
  is_active boolean DEFAULT true,
  dealership_id uuid REFERENCES dealerships(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_contacted timestamptz
);

-- Create todos table
CREATE TABLE IF NOT EXISTS todos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed', 'cancelled')),
  category text NOT NULL,
  assigned_to text NOT NULL,
  assigned_by text NOT NULL,
  due_date date,
  due_time time,
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE SET NULL,
  vehicle_name text,
  tags text[] DEFAULT '{}',
  notes text,
  completed_at timestamptz,
  completed_by text,
  dealership_id uuid REFERENCES dealerships(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create locations table
CREATE TABLE IF NOT EXISTS locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  capacity integer,
  dealership_id uuid REFERENCES dealerships(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE dealerships ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then create new ones
DROP POLICY IF EXISTS "Dealerships can read own data" ON dealerships;
DROP POLICY IF EXISTS "Dealerships can update own data" ON dealerships;
DROP POLICY IF EXISTS "Users can read dealership users" ON users;
DROP POLICY IF EXISTS "Admins can manage dealership users" ON users;
DROP POLICY IF EXISTS "Users can read dealership vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can manage dealership vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can read dealership contacts" ON contacts;
DROP POLICY IF EXISTS "Users can manage dealership contacts" ON contacts;
DROP POLICY IF EXISTS "Users can read dealership todos" ON todos;
DROP POLICY IF EXISTS "Users can manage dealership todos" ON todos;
DROP POLICY IF EXISTS "Users can read dealership locations" ON locations;
DROP POLICY IF EXISTS "Users can manage dealership locations" ON locations;

-- Create policies for dealerships
CREATE POLICY "Dealerships can read own data"
  ON dealerships
  FOR SELECT
  TO authenticated
  USING (id IN (
    SELECT dealership_id FROM users WHERE auth.uid()::text = id::text
  ));

CREATE POLICY "Dealerships can update own data"
  ON dealerships
  FOR UPDATE
  TO authenticated
  USING (id IN (
    SELECT dealership_id FROM users WHERE auth.uid()::text = id::text
  ));

-- Create policies for users
CREATE POLICY "Users can read dealership users"
  ON users
  FOR SELECT
  TO authenticated
  USING (dealership_id IN (
    SELECT dealership_id FROM users WHERE auth.uid()::text = id::text
  ));

CREATE POLICY "Admins can manage dealership users"
  ON users
  FOR ALL
  TO authenticated
  USING (dealership_id IN (
    SELECT dealership_id FROM users 
    WHERE auth.uid()::text = id::text AND role = 'admin'
  ));

-- Create policies for vehicles
CREATE POLICY "Users can read dealership vehicles"
  ON vehicles
  FOR SELECT
  TO authenticated
  USING (dealership_id IN (
    SELECT dealership_id FROM users WHERE auth.uid()::text = id::text
  ));

CREATE POLICY "Users can manage dealership vehicles"
  ON vehicles
  FOR ALL
  TO authenticated
  USING (dealership_id IN (
    SELECT dealership_id FROM users WHERE auth.uid()::text = id::text
  ));

-- Create policies for contacts
CREATE POLICY "Users can read dealership contacts"
  ON contacts
  FOR SELECT
  TO authenticated
  USING (dealership_id IN (
    SELECT dealership_id FROM users WHERE auth.uid()::text = id::text
  ));

CREATE POLICY "Users can manage dealership contacts"
  ON contacts
  FOR ALL
  TO authenticated
  USING (dealership_id IN (
    SELECT dealership_id FROM users WHERE auth.uid()::text = id::text
  ));

-- Create policies for todos
CREATE POLICY "Users can read dealership todos"
  ON todos
  FOR SELECT
  TO authenticated
  USING (dealership_id IN (
    SELECT dealership_id FROM users WHERE auth.uid()::text = id::text
  ));

CREATE POLICY "Users can manage dealership todos"
  ON todos
  FOR ALL
  TO authenticated
  USING (dealership_id IN (
    SELECT dealership_id FROM users WHERE auth.uid()::text = id::text
  ));

-- Create policies for locations
CREATE POLICY "Users can read dealership locations"
  ON locations
  FOR SELECT
  TO authenticated
  USING (dealership_id IN (
    SELECT dealership_id FROM users WHERE auth.uid()::text = id::text
  ));

CREATE POLICY "Users can manage dealership locations"
  ON locations
  FOR ALL
  TO authenticated
  USING (dealership_id IN (
    SELECT dealership_id FROM users WHERE auth.uid()::text = id::text
  ));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_dealership_id ON users(dealership_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_dealership_id ON vehicles(dealership_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_vin ON vehicles(vin);
CREATE INDEX IF NOT EXISTS idx_contacts_dealership_id ON contacts(dealership_id);
CREATE INDEX IF NOT EXISTS idx_todos_dealership_id ON todos(dealership_id);
CREATE INDEX IF NOT EXISTS idx_todos_assigned_to ON todos(assigned_to);
CREATE INDEX IF NOT EXISTS idx_locations_dealership_id ON locations(dealership_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers if they exist, then create new ones
DROP TRIGGER IF EXISTS update_dealerships_updated_at ON dealerships;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_vehicles_updated_at ON vehicles;
DROP TRIGGER IF EXISTS update_contacts_updated_at ON contacts;
DROP TRIGGER IF EXISTS update_todos_updated_at ON todos;
DROP TRIGGER IF EXISTS update_locations_updated_at ON locations;

-- Create triggers for updated_at
CREATE TRIGGER update_dealerships_updated_at BEFORE UPDATE ON dealerships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_todos_updated_at BEFORE UPDATE ON todos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();