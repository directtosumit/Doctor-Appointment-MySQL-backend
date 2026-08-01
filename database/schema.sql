-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS appointment_db;

USE appointment_db;

-- 1. Doctors Table (Stores doctor profiles)
CREATE TABLE IF NOT EXISTS doctors ( -- role is "doctor"
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  specialization VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Patients Table (Stores patient profiles)
CREATE TABLE IF NOT EXISTS patients ( -- role is "patient"
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Availability Slots Table (Replaces nested arrays of dates/times)
CREATE TABLE IF NOT EXISTS availability_slots (
  id INT AUTO_INCREMENT PRIMARY KEY,
  doctor_id INT NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_booked BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (doctor_id) REFERENCES doctors (id) ON DELETE CASCADE
);

-- 4. Appointments Table (Links a patient, a doctor, and a specific time slot together)
CREATE TABLE IF NOT EXISTS appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  doctor_id INT NOT NULL,
  patient_id INT NOT NULL,
  slot_id INT NOT NULL,
  appointment_date DATE NOT NULL,
  status ENUM ('Booked', 'Completed', 'Cancelled') DEFAULT 'Booked',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (doctor_id) REFERENCES doctors (id) ON DELETE CASCADE,
  FOREIGN KEY (patient_id) REFERENCES patients (id) ON DELETE CASCADE,
  FOREIGN KEY (slot_id) REFERENCES availability_slots (id) ON DELETE CASCADE
);
