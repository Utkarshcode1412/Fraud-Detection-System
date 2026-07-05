-- =====================================================================
-- Seed data — demo admin login + a few sample users.
-- Password for the demo admin below is: Admin123!
-- (bcrypt hash generated with bcryptjs, cost factor 10)
-- =====================================================================

INSERT INTO admins (full_name, email, password_hash, role)
VALUES (
    'Alex Rivera',
    'analyst@frauddetect.dev',
    '$2b$10$khIPb.iuNn/I3XCqlEqLAuE/oZwutnJNWwj5zcRXljSfHxEtBu6QW',
    'senior_analyst'
)
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (full_name, email, phone, home_country, home_latitude, home_longitude)
VALUES
    ('Priya Sharma', 'priya.sharma@example.com', '+91-9820011223', 'IN', 19.0760, 72.8777),
    ('James Miller', 'james.miller@example.com', '+1-212-555-0148', 'US', 40.7128, -74.0060),
    ('Sofia Rossi', 'sofia.rossi@example.com', '+39-06-555-0192', 'DE', 52.5200, 13.4050)
ON CONFLICT (email) DO NOTHING;
