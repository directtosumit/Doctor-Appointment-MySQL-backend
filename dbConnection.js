const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ override: false });

async function initializeDatabaseWithRetry(retries = 5, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
        multipleStatements: true,
      });

      const schemaPath = path.join(__dirname, "database/schema.sql");
      if (fs.existsSync(schemaPath)) {
        let schemaSql = fs.readFileSync(schemaPath, "utf8");
        if (process.env.DB_NAME)
          schemaSql = schemaSql.replaceAll("appointment_db", process.env.DB_NAME);

        await connection.query(schemaSql);
        console.log("Database and tables verified/created successfully.");
      }
      await connection.end();
      return; // Success! Exit retry loop
    } catch (err) {
      console.log(`Database connection attempt ${i + 1} failed (${err.message}). Retrying in ${delay / 1000}s...`);
      if (i === retries - 1) throw err;
      await new Promise((res) => setTimeout(res, delay));
    }
  }
}

// Initialize asynchronously without crashing top-level scope
initializeDatabaseWithRetry().catch((err) => {
  console.error("Fatal error initializing database schema:", err);
});

// 2. Export the standard connection pool pointing to your database
/** @type {import('mysql2/promise').Pool} */
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;
