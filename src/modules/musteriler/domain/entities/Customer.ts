export class Customer {
  id: string;
  name: string;
  phone: string;
  phone_display: string;
  notes: string;
  source: string;
  total: number;
  upcoming: number;
  past: number;
  cancelled: number;
  next_starts_at: string | null;
  next_doctor: string | null;
  next_request: string | null;
  last_visit_at: string | null;
  last_request: string | null;
  created_at: string;
}