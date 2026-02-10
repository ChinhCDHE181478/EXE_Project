-- Seed data cho subscription packages
INSERT INTO subscription_packages (code, duration_days, price, is_active, display_name, create_at, update_at, delete_flag) 
VALUES 
  ('day', 1, 10000, true, 'Gói 1 ngày', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false),
  ('month', 30, 49000, true, 'Gói 30 ngày', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false)
ON CONFLICT (code) DO NOTHING;
