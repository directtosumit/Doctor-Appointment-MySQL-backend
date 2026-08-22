const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const path = require("path");
require("dotenv").config({ override: false });

const pool = require("./dbConnection");

async function seedDatabase() {
  // Create connection to your MySQL server

  console.log("Seeding 1,000 doctors and 1,000 patients...");
  const hashedPassword = await bcrypt.hash("password123", 10);
  const specializations = [
    "Cardiologist",
    "Dermatologist",
    "Pediatrician",
    "Neurologist",
    "General Physician",
    "Orthopedic",
  ];

  const startEndTimes = [
    ["10:00:00", "11:00:00"],
    ["11:00:00", "12:00:00"],
    ["12:00:00", "13:00:00"],
    ["15:00:00", "16:00:00"],
  ];

  // 1. Insert 1,000 Doctors
  for (let i = 1; i <= 1000; i++) {
    const name = `Dr. Doctor ${i}`;
    const email = `doctor${i}@example.com`;
    const spec = specializations[i % specializations.length];

    const [result] = await pool.execute(
      "INSERT IGNORE INTO doctors (name, email, password, phone, specialization) VALUES (?, ?, ?, ?, ?)",
      [name, email, hashedPassword, `${i}`.padStart(10, "1"), spec],
    );

    // Add a sample availability slot for the first few doctors for testing
    if (result.insertId && i <= 50) {
      let startEndTime = startEndTimes[i % startEndTimes.length];
      await pool.execute(
        "INSERT INTO availability_slots (doctor_id, date, start_time, end_time, is_booked) VALUES (?, CURRENT_DATE, ?, ?, FALSE)",
        [result.insertId, startEndTime[0], startEndTime[1]],
      );
    }
  }

  // 2. Insert 1,000 Patients
  for (let i = 1; i <= 1000; i++) {
    const name = `Patient User ${i}`;
    const email = `patient${i}@example.com`;

    await pool.execute(
      "INSERT IGNORE INTO patients (name, email, phone, password) VALUES (?, ?, ?, ?)",
      [name, email, `${i}`.padStart(10, "1"), hashedPassword],
    );
  }

  console.log("Seeding completed successfully!");
  pool.end();
}

seedDatabase().catch((err) => console.error("Seeding failed:", err));
