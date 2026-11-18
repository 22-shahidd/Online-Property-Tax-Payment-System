-- Online Property Tax Payment System - Nagarpalika
-- Import this file via phpMyAdmin's Import tab (no need to create the database first).
-- It creates the database and all six tables automatically.

CREATE DATABASE IF NOT EXISTS property_tax_db;
USE property_tax_db;

-- Drop existing tables (reverse order to avoid dependency errors on re-import)
DROP TABLE IF EXISTS grievancemaster;
DROP TABLE IF EXISTS paymentmaster;
DROP TABLE IF EXISTS taxmaster;
DROP TABLE IF EXISTS propertymaster;
DROP TABLE IF EXISTS wardmaster;
DROP TABLE IF EXISTS usermaster;

CREATE TABLE usermaster (
  uid INT AUTO_INCREMENT PRIMARY KEY,
  uname VARCHAR(100) NOT NULL,
  email VARCHAR(50) NOT NULL UNIQUE,
  upwd VARCHAR(255) NOT NULL,
  urole VARCHAR(10) NOT NULL,       -- 'citizen' / 'officer' / 'admin'
  phone VARCHAR(10) NOT NULL,
  status VARCHAR(10) DEFAULT 'active'
);

CREATE TABLE wardmaster (
  wid INT AUTO_INCREMENT PRIMARY KEY,
  wardno VARCHAR(10) NOT NULL,
  zone VARCHAR(15) NOT NULL,
  officer_id INT
);

CREATE TABLE propertymaster (
  pid INT AUTO_INCREMENT PRIMARY KEY,
  uid INT NOT NULL,                 -- owner (citizen)
  tno VARCHAR(20) NOT NULL,         -- tenement number, e.g. VLD-0142
  address VARCHAR(150) NOT NULL,
  wid INT NOT NULL,
  areasq INT NOT NULL,
  ptype VARCHAR(15) NOT NULL,       -- residential / commercial / industrial
  cyear INT NOT NULL,
  status VARCHAR(15) DEFAULT 'pending',  -- pending / verified / rejected
  verified_by INT,
  remark VARCHAR(150)
);

CREATE TABLE taxmaster (
  tid INT AUTO_INCREMENT PRIMARY KEY,
  pid INT NOT NULL,
  assessyear INT NOT NULL,
  basetax DECIMAL(10,2) NOT NULL,
  rebate DECIMAL(10,2) DEFAULT 0,
  penalty DECIMAL(10,2) DEFAULT 0,
  totaldue DECIMAL(10,2) NOT NULL,
  status VARCHAR(10) DEFAULT 'unpaid',   -- paid / unpaid
  duedate DATE NOT NULL
);

CREATE TABLE paymentmaster (
  payid INT AUTO_INCREMENT PRIMARY KEY,
  tid INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  mode VARCHAR(10) NOT NULL,        -- online / offline
  recno VARCHAR(20) NOT NULL,
  paiddate DATETIME DEFAULT CURRENT_TIMESTAMP,
  collected_by INT
);

CREATE TABLE grievancemaster (
  gid INT AUTO_INCREMENT PRIMARY KEY,
  uid INT NOT NULL,
  pid INT NOT NULL,
  subject VARCHAR(100) NOT NULL,
  description VARCHAR(300) NOT NULL,
  status VARCHAR(15) DEFAULT 'open',  -- open / in_progress / resolved
  officer_id INT,
  resolution VARCHAR(300),
  createddate DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Seed data: clean demo dataset for testing
-- 1 admin, 3 officers, 6 citizens, 3 wards
-- Each citizen has 2 properties: 1 verified + 1 pending
-- Taxes exist only for verified properties
-- No payment records initially

INSERT INTO usermaster (uid, uname, email, upwd, urole, phone, status) VALUES
(1, 'System Admin', 'admin@np.in', 'admin123', 'admin', '9999999999', 'active'),
(2, 'Shahid Shaikh', 'shahid@np.in', 'officer123', 'officer', '9888812345', 'active'),
(3, 'Rayyan Shaikh', 'rayyan@np.in', 'officer123', 'officer', '9888856789', 'active'),
(4, 'Samir Shaikh', 'samir@np.in', 'officer123', 'officer', '9888877777', 'active'),
(5, 'Amit Patel', 'amit@np.in', 'citizen123', 'citizen', '9876500001', 'active'),
(6, 'Neha Shah', 'neha@np.in', 'citizen123', 'citizen', '9876500002', 'active'),
(7, 'Rahul Desai', 'rahul@np.in', 'citizen123', 'citizen', '9876500003', 'active'),
(8, 'Pooja Mehta', 'pooja@np.in', 'citizen123', 'citizen', '9876500004', 'active'),
(9, 'Karan Joshi', 'karan@np.in', 'citizen123', 'citizen', '9876500005', 'active'),
(10, 'Ayesha Khan', 'ayesha@np.in', 'citizen123', 'citizen', '9876500006', 'active');

INSERT INTO wardmaster (wid, wardno, zone, officer_id) VALUES
(1, 'W01', 'North', 2),
(2, 'W02', 'South', 3),
(3, 'W03', 'East', 4);

INSERT INTO propertymaster
(pid, uid, tno, address, wid, areasq, ptype, cyear, status, verified_by, remark) VALUES
(1, 5, 'VLD-1001', '12 Station Road, Valsad', 1, 1200, 'residential', 2012, 'verified', 2, 'Verified by ward officer'),
(2, 5, 'VLD-1002', '15 Station Road, Valsad', 1, 950, 'commercial', 2018, 'pending', NULL, NULL),
(3, 6, 'VLD-1003', '21 Tithal Road, Valsad', 1, 1100, 'residential', 2015, 'verified', 2, 'Verified by ward officer'),
(4, 6, 'VLD-1004', '24 Tithal Road, Valsad', 1, 1400, 'industrial', 2020, 'pending', NULL, NULL),
(5, 7, 'VLD-1005', '8 Main Bazaar, Valsad', 2, 900, 'commercial', 2010, 'verified', 3, 'Verified by ward officer'),
(6, 7, 'VLD-1006', '10 Main Bazaar, Valsad', 2, 1000, 'residential', 2022, 'pending', NULL, NULL),
(7, 8, 'VLD-1007', '33 Dharampur Road, Valsad', 2, 1250, 'residential', 2016, 'verified', 3, 'Verified by ward officer'),
(8, 8, 'VLD-1008', '35 Dharampur Road, Valsad', 2, 800, 'commercial', 2019, 'pending', NULL, NULL),
(9, 9, 'VLD-1009', '5 Abrama Road, Valsad', 3, 1500, 'residential', 2011, 'verified', 4, 'Verified by ward officer'),
(10, 9, 'VLD-1010', '7 Abrama Road, Valsad', 3, 1050, 'commercial', 2021, 'pending', NULL, NULL),
(11, 10, 'VLD-1011', '18 Kapadia Circle, Valsad', 3, 1000, 'commercial', 2014, 'verified', 4, 'Verified by ward officer'),
(12, 10, 'VLD-1012', '20 Kapadia Circle, Valsad', 3, 1300, 'residential', 2023, 'pending', NULL, NULL);

INSERT INTO taxmaster
(tid, pid, assessyear, basetax, rebate, penalty, totaldue, status, duedate) VALUES
(1, 1, 2026, 2400.00, 200.00, 0.00, 2200.00, 'unpaid', '2026-09-30'),
(2, 3, 2026, 2100.00, 150.00, 0.00, 1950.00, 'unpaid', '2026-09-30'),
(3, 5, 2026, 3200.00, 300.00, 0.00, 2900.00, 'unpaid', '2026-09-30'),
(4, 7, 2026, 2500.00, 200.00, 0.00, 2300.00, 'unpaid', '2026-09-30'),
(5, 9, 2026, 3600.00, 250.00, 0.00, 3350.00, 'unpaid', '2026-09-30'),
(6, 11, 2026, 3000.00, 200.00, 0.00, 2800.00, 'unpaid', '2026-09-30');

-- paymentmaster intentionally left empty so payment/revenue testing starts from zero.

INSERT INTO grievancemaster
(gid, uid, pid, subject, description, status, officer_id, resolution) VALUES
(1, 5, 1, 'Tax amount query', 'Please verify the property tax amount shown for my verified property.', 'open', 2, NULL),
(2, 6, 3, 'Property details correction', 'The property address needs a small correction in the record.', 'in_progress', 2, NULL),
(3, 7, 5, 'Payment assistance', 'I need assistance understanding the property tax payment process.', 'resolved', 3, 'Payment process explained to the citizen.'),
(4, 9, 9, 'Property verification request', 'Please complete verification of my newly registered property.', 'open', 4, NULL),
(5, 10, 11, 'Receipt request', 'Please provide guidance on obtaining the tax payment receipt.', 'resolved', 4, 'Receipt procedure explained to the citizen.');
