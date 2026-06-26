-- 1. Create Enums for Status and Event Types
DO $$ BEGIN
    CREATE TYPE appointment_status AS ENUM ('Pending', 'Approved', 'Cancelled', 'Expired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE appointment_event_type AS ENUM ('CREATED', 'SLOT_SELECTED', 'APPROVED', 'CANCELLED', 'RESCHEDULED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;


-- 2. Create the "Current State" Projection Table (appointments)
CREATE TABLE IF NOT EXISTS appointments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_phone TEXT NOT NULL,
    customer_name TEXT,
    service_id TEXT NOT NULL,
    employee_id TEXT,
    date TEXT NOT NULL,
    status appointment_status NOT NULL DEFAULT 'Pending',
    booking_token TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);


-- 3. Create the "Event Sourcing Light" Table (appointment_events)
CREATE TABLE IF NOT EXISTS appointment_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    event_type appointment_event_type NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);


-- 4. Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_appointments_customer_phone ON appointments(customer_phone);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_booking_token ON appointments(booking_token);
CREATE INDEX IF NOT EXISTS idx_appointment_events_appointment_id ON appointment_events(appointment_id);


-- 5. Row Level Security (RLS)
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_events ENABLE ROW LEVEL SECURITY;

-- Policies for 'appointments'
-- Allow read access to authenticated users (e.g. business owner viewing their calendar)
CREATE POLICY "Allow authenticated users to read appointments"
ON appointments FOR SELECT
TO authenticated
USING (true);

-- Allow Edge Functions (Service Role) to manage everything
-- Note: Service Role bypasses RLS, but it's good practice to explicitly state policies if a custom JWT is used.
CREATE POLICY "Allow service role to manage appointments"
ON appointments FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policies for 'appointment_events'
-- Read access for authenticated users
CREATE POLICY "Allow authenticated users to read events"
ON appointment_events FOR SELECT
TO authenticated
USING (true);

-- Insert access for Edge Functions (Service Role)
CREATE POLICY "Allow service role to insert events"
ON appointment_events FOR INSERT
TO service_role
WITH CHECK (true);

-- Prevent Updates or Deletes on appointment_events to enforce append-only immutable event sourcing
CREATE POLICY "Prevent updates on events"
ON appointment_events FOR UPDATE
TO public
USING (false)
WITH CHECK (false);

CREATE POLICY "Prevent deletes on events"
ON appointment_events FOR DELETE
TO public
USING (false);


-- 6. Updated_at Trigger for appointments
CREATE OR REPLACE FUNCTION update_appointments_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_appointments_updated_at ON appointments;
CREATE TRIGGER trg_appointments_updated_at
BEFORE UPDATE ON appointments
FOR EACH ROW
EXECUTE FUNCTION update_appointments_updated_at_column();
