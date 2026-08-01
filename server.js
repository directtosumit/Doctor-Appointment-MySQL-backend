const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const { verifyUserAndToken, verifyToken } = require("./authMiddleware");

const app = express();
app.use(express.json());
app.use(cors());

// MySQL Connection Pool
const pool = require("./dbConnection");

const {
  doctor,
  patient,
  doctors,
  patients,
  availability_slots,
  appointments,
  booked,
  completed,
  cancelled,
} = require("./constants");
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_key_123";

// --- AUTHENTICATION ROUTES ---

// Login for both Doctor and Patient
app.post("/api/auth/login", async (req, res) => {
  const { email, password, role } = req.body; // role: 'doctor' or 'patient'
  if (!email || !password || !role) {
    return res
      .status(400)
      .json({ error: "Email, password, and role are required" });
  }

  try {
    const tableName = role === doctor ? doctors : patients;
    const [rows] = await pool.execute(
      `SELECT * FROM ${tableName} WHERE email = ?`,
      [email],
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role },
      JWT_SECRET,
      { expiresIn: "1d" },
    );
    res.json({
      message: "Login successful",
      token,
      user: { id: user.id, name: user.name, email: user.email, role },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- DOCTOR ROUTES ---

// Add availability slot
app.post(
  "/api/doctor/availability/add",
  verifyUserAndToken,
  async (req, res) => {
    let { user } = req;
    if (user.role !== doctor) {
      return res
        .status(403)
        .json({ error: "You are not allowed to do this operation." });
    }
    const doctor_id = user.id;

    const { date, start_time, end_time } = req.body;

    // 1. Check if all required fields are present
    if (!doctor_id || !date || !start_time || !end_time) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // 2. Validate date format (YYYY-MM-DD) using Regex & Date check
    if (!dateRegex.test(date) || isNaN(Date.parse(date))) {
      return res
        .status(400)
        .json({ error: "Invalid date format. Expected YYYY-MM-DD" });
    }

    // 3. Validate time format (HH:MM or HH:MM:SS) using Regex
    if (!timeRegex.test(start_time) || !timeRegex.test(end_time)) {
      return res
        .status(400)
        .json({ error: "Invalid time format. Expected HH:MM or HH:MM:SS" });
    }

    // Normalize times to "HH:mm:ss" for strict and safe comparison
    const normalizeTime = (t) => {
      return t.length === 5 ? `${t}:00` : t;
    };

    const normalizedStart = normalizeTime(start_time);
    const normalizedEnd = normalizeTime(end_time);

    //4. Check if start_time is strictly less than end_time
    if (normalizedStart >= normalizedEnd) {
      return res
        .status(400)
        .json({ error: "Start time must be earlier than end time" });
    }

    try {
      // 5. Check if an identical slot already exists for this doctor on the same date
      const [existingSlots] = await pool.execute(
        `SELECT id FROM ${availability_slots} WHERE doctor_id = ? AND date = ? AND start_time = ? AND end_time = ?`,
        [doctor_id, date, start_time, end_time],
      );

      if (existingSlots.length > 0) {
        return res.status(409).json({
          error: "This exact availability slot already exists for this date.",
        });
      }

      // 6. Insert new slot
      await pool.execute(
        `INSERT INTO ${availability_slots} (doctor_id, date, start_time, end_time) VALUES (?, ?, ?, ?)`,
        [doctor_id, date, start_time, end_time],
      );
      res.status(201).json({ message: "Availability slot added successfully" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

// Verify token and return user details for auto-login
app.post("/api/auth/verify", verifyToken, async (req, res) => {
  try {
    // verifyToken middleware already validated the token
    // and attached the decoded user payload to req.user.
    const { id, role } = req.user;

    let userDetails;
    if (role === doctor) {
      const [rows] = await pool.execute(
        `SELECT id, name, email, specialization FROM ${doctors} WHERE id = ?`,
        [id],
      );
      if (rows.length === 0)
        return res.status(404).json({ error: "User not found" });
      userDetails = rows[0];
    } else if (role === "patient") {
      const [rows] = await pool.execute(
        `SELECT id, name, email FROM ${patients} WHERE id = ?`,
        [id],
      );
      if (rows.length === 0)
        return res.status(404).json({ error: "User not found" });
      userDetails = rows[0];
    } else {
      return res.status(400).json({ error: "Invalid user role" });
    }

    res.json({ valid: true, user: { ...userDetails, role } });
  } catch (err) {
    res.status(500).json({ valid: false, error: err.message });
  }
});

// View doctor details & available slots
app.post("/api/doctors/view", verifyUserAndToken, async (req, res) => {
  let { user } = req;
  if (user.role !== patient && user.role !== doctor) {
    return res
      .status(403)
      .json({ error: "You are not allowed to do this operation." });
  }

  const isDoctor = user.role === doctor;

  const { id } = isDoctor ? user : req.body;
  try {
    let doctorDetails;
    if (!isDoctor) {
      const [doctorRows] = await pool.execute(
        `SELECT id, name, email, specialization FROM ${doctors} WHERE id = ?`,
        [id],
      );
      if (doctorRows.length === 0)
        return res.status(404).json({ error: "Doctor not found" });
      doctorDetails = doctorRows[0];
    }

    const [slots] = await pool.execute(
      `SELECT * FROM ${availability_slots} WHERE doctor_id = ? AND is_booked = FALSE`,
      [id],
    );

    res.json({ doctor: doctorDetails, available_slots: slots });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remove an available availability slot
app.post(
  "/api/doctor/availability/remove",
  verifyUserAndToken,
  async (req, res) => {
    const { user } = req;

    if (user.role !== doctor) {
      return res
        .status(403)
        .json({ error: "Only doctors are allowed to perform this operation." });
    }

    const { slotId } = req.body;
    const doctorId = user.id;

    if (!slotId) {
      return res.status(400).json({ error: "Slot ID is required." });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Lock the specific slot row to prevent concurrent race conditions
      const [slots] = await connection.execute(
        `SELECT * FROM ${availability_slots} WHERE id = ? AND doctor_id = ? FOR UPDATE`,
        [slotId, doctorId],
      );

      if (slots.length === 0) {
        await connection.rollback();
        return res
          .status(404)
          .json({ error: "Slot not found or unauthorized." });
      }

      // 2. Check if the slot has already been booked by a patient
      if (slots[0].is_booked) {
        await connection.rollback();
        return res.status(400).json({
          error: "Cannot delete a slot that has already been booked.",
        });
      }

      // 3. Safely delete the unbooked availability slot
      await connection.execute(
        `DELETE FROM ${availability_slots} WHERE id = ?`,
        [slotId],
      );

      await connection.commit();
      res.json({ message: "Availability slot removed successfully." });
    } catch (err) {
      await connection.rollback();
      res.status(500).json({ error: err.message });
    } finally {
      connection.release();
    }
  },
);

// View all appointments for a doctor with pagination
app.post(
  "/api/doctor/appointments/view",
  verifyUserAndToken,
  async (req, res) => {
    let { user } = req;
    if (user.role !== doctor) {
      return res
        .status(403)
        .json({ error: "You are not allowed to do this operation." });
    }
    const doctorId = user.id;

    // Extract pagination parameters from request body, with safe defaults
    let page = parseInt(req.body.page) || 1;
    let limit = parseInt(req.body.limit) || 30;
    if (page < 1) page = 1;
    if (limit < 1) limit = 30;
    const offset = (page - 1) * limit;

    try {
      // 1. Fetch total count for pagination metadata
      const [countResult] = await pool.execute(
        `SELECT COUNT(*) as total
         FROM ${appointments} a
         WHERE a.doctor_id = ?`,
        [doctorId],
      );
      const totalItems = countResult[0].total;
      const totalPages = Math.ceil(totalItems / limit);

      // 2. Fetch paginated records using LIMIT and OFFSET
      // Note: Using template literal for LIMIT/OFFSET to avoid MySQL type binding quirks with integers
      const [appointmentsList] = await pool.execute(
        `SELECT a.id, p.name as patient_name, p.email, s.date, s.start_time, s.end_time, a.status 
             FROM ${appointments} a
             JOIN ${patients} p ON a.patient_id = p.id
             JOIN ${availability_slots} s ON a.slot_id = s.id
             WHERE a.doctor_id = ?
             ORDER BY s.date DESC, s.start_time DESC
             LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
        [doctorId],
      );

      // 3. Return response with metadata and data payload
      res.json({
        data: appointmentsList,
        page,
        itemsPerPage: limit,
        total: totalItems,
        totalPages,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

// --- PATIENT ROUTES ---

// Search doctors with pagination, name, specialization, and date filters
app.post("/api/doctors/search", verifyUserAndToken, async (req, res) => {
  let { user } = req;
  if (user.role !== "patient") {
    return res
      .status(403)
      .json({ error: "You are not allowed to do this operation." });
  }

  let { name, specialization, date, page = 1, limit = 30 } = req.body;
  page = parseInt(page) || 1;
  limit = parseInt(limit) || 30;
  const offset = (page - 1) * limit;

  try {
    let query = `SELECT DISTINCT d.id, d.name, d.email, d.specialization FROM ${doctors} d`;
    let countQuery = `SELECT COUNT(DISTINCT d.id) as total FROM ${doctors} d`;
    let queryParams = [];
    let conditions = [];

    if (date) {
      if (!dateRegex.test(date) || isNaN(Date.parse(date))) {
        return res
          .status(400)
          .json({ error: "Invalid date format. Expected YYYY-MM-DD" });
      }

      query += ` JOIN ${availability_slots} s ON d.id = s.doctor_id`;
      countQuery += ` JOIN ${availability_slots} s ON d.id = s.doctor_id`;
      conditions.push(`s.date = ? AND s.is_booked = FALSE`);
      queryParams.push(date);
    }

    if (name) {
      conditions.push(`d.name LIKE ?`);
      queryParams.push(`%${name}%`);
    }

    if (specialization) {
      conditions.push(`d.specialization LIKE ?`);
      queryParams.push(`%${specialization}%`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(" AND ");
      countQuery += ` WHERE ` + conditions.join(" AND ");
    }

    // Capture parameters count before appending LIMIT and OFFSET
    const countParams = [...queryParams];

    query += ` LIMIT ? OFFSET ?`;
    queryParams.push(limit + "", offset + "");

    // Execute main query (Node.js mysql2 requires limit and offset to be Numbers)
    const [doctorList] = await pool.execute(query, queryParams);

    // Execute count query using only the filter conditions parameters
    const [countResult] = await pool.execute(countQuery, countParams);

    res.json({
      total: countResult[0].total,
      page,
      totalPages: Math.ceil(countResult[0].total / limit),
      itemsPerPage: limit,
      doctors: doctorList,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
});

// Book an appointment
app.post("/api/appointments", verifyUserAndToken, async (req, res) => {
  let { user } = req;
  if (user.role !== patient) {
    return res
      .status(403)
      .json({ error: "You are not allowed to do this operation." });
  }
  const patient_id = user.id;

  const { doctor_id, slot_id, appointment_date } = req.body;

  if (
    !dateRegex.test(appointment_date) ||
    isNaN(Date.parse(appointment_date))
  ) {
    return res
      .status(400)
      .json({ error: "Invalid date format. Expected YYYY-MM-DD" });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Check if slot is already booked
    const [slotRows] = await connection.execute(
      `SELECT is_booked FROM ${availability_slots} WHERE id = ? FOR UPDATE`,
      [slot_id],
    );
    if (!slotRows.length || slotRows[0].is_booked) {
      await connection.rollback();
      return res
        .status(400)
        .json({ error: "Slot is already booked or invalid" });
    }

    // Mark slot as booked
    await connection.execute(
      `UPDATE ${availability_slots} SET is_booked = TRUE WHERE id = ?`,
      [slot_id],
    );

    // Create appointment record
    await connection.execute(
      `INSERT INTO ${appointments} (doctor_id, patient_id, slot_id, appointment_date, status) VALUES (?, ?, ?, ?, ?)`,
      [doctor_id, patient_id, slot_id, appointment_date, booked],
    );

    await connection.commit();
    res.json({ message: "Appointment booked successfully" });
  } catch (err) {
    console.log(err);
    await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

// View patient's booked appointments
app.post(
  "/api/patient/appointments/view",
  verifyUserAndToken,
  async (req, res) => {
    let { user } = req;
    if (user.role !== patient) {
      return res
        .status(403)
        .json({ error: "You are not allowed to do this operation." });
    }
    const patientId = user.id;

    // const { patientId } = req.body;
    try {
      const [appointmentsList] = await pool.execute(
        `SELECT a.id, d.name as doctor_name, d.email, d.specialization, s.date, s.start_time, s.end_time, a.status 
             FROM ${appointments} a
             JOIN ${doctors} d ON a.doctor_id = d.id
             JOIN ${availability_slots} s ON a.slot_id = s.id
             WHERE a.patient_id = ?`,
        [patientId],
      );
      res.json(appointmentsList);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
