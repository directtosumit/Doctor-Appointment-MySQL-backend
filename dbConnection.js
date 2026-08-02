const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

async function initializeDatabase() {
  // 1. Create a temporary connection without a default database
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5000,
    multipleStatements: true, // Required to run multiple SQL queries at once
  });

  try {
    // 2. Read and execute the schema.sql file automatically
    const schemaPath = path.join(__dirname, "database/schema.sql");
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, "utf8");
      await connection.query(schemaSql);
      console.log("Database and tables verified/created successfully.");
    }
  } catch (err) {
    console.error("Error initializing database schema:", err.message);
  } finally {
    await connection.end();
  }
}

// Run the initialization before exporting the pool
initializeDatabase();

// 2. Export the standard connection pool pointing to your database
/** @type {import('mysql2/promise').Pool} */
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 5000,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;
