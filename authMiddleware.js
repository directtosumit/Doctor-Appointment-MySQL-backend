const jwt = require("jsonwebtoken");

const pool = require("./dbConnection");
const { doctor, patient, doctors, patients } = require("./constants");

function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Extract token after "Bearer"

  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {
    // Verify token using your secret key
    req.user = jwt.verify(token, process.env.JWT_SECRET); // Attach user info (like id, role) to the request object
    next(); // Move on to the route handler
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
}

async function verifyUserAndToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {
    // 1. Verify token signature and expiration
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { role } = decoded;

    // decoded typically looks like: { id: 1, role: 'doctor', iat: ..., exp: ... }

    // 2. OPTIONAL SECURITY STEP: Check if user still exists in the database
    let tableName = role === doctor ? doctors : patients;

    const [rows] = await pool.execute(
      `SELECT id, email FROM ${tableName} WHERE id = ?`,
      [decoded.id],
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "User no longer exists." });
    }

    // 3. Attach fresh user data from DB to the request
    req.user = { id: rows[0].id, email: rows[0].email, role };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
}

module.exports = { verifyToken, verifyUserAndToken };
