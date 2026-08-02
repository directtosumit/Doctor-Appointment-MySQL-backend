


# Appointment System - Backend Server

A robust Node.js and Express backend API for the Doctor Appointment System, featuring MySQL database integration, JWT-based authentication, request duration logging middleware, and Postman collection support.


## Key Features of the Backend Server

* **MySQL Database Integration**: Connects seamlessly with MySQL to manage structured data for doctors, patients, availability slots, and appointments.
* **JWT-Based Authentication**: Secure login mechanism that issues a JSON Web Token (JWT) upon successful authentication.
* **Role-Based Authorization & Protected Routes**: Subsequent API requests require the JWT token passed via headers (`Authorization: Bearer <token>`). Middleware verifies the token, user ID, and role to ensure users only access the data and endpoints permitted for their specific profile.
* **Doctor Management API**: Enables doctors to securely add/remove availability slots and view their scheduled patient appointments.
* **Patient Management & Booking API**: Allows patients to search for doctors, view slot details, book appointments, and check their personal appointment history.
* **Request Logging Middleware**: Tracks and records request durations and metadata for robust debugging and monitoring.
* **Postman Collection Support**: Includes a ready-to-import Postman collection (`postman/Appointment_System.postman_collection.json`) to easily test all endpoints.

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Project Setup Steps](#project-setup-steps)
3. [Environment Variables Required](#environment-variables-required)
4. [Database Setup Instructions](#database-setup-instructions)
5. [Seed Execution Steps](#seed-execution-steps)
6. [Login Credentials for Doctor and Patient](#login-credentials-for-doctor-and-patient)
7. [Running the Server](#running-the-server)
8. [Testing with Postman](#testing-with-postman)

---

## Prerequisites

Make sure you have the following installed on your local machine:
* **Node.js** (v18 or higher recommended)
* **MySQL Server** (Running locally on port 5000)

---

## Project Setup Steps

1. **Clone the repository and navigate to the backend directory:**
   ```bash
   cd appointment-backend



2. **Install project dependencies:**
```bash
npm install

```



---

## Environment Variables Required

Create a file named **`.env`** in the root of the `appointment-backend` folder and add the following configuration variables:

```env
DB_HOST=127.0.0.1
DB_USER=app_user
DB_PASSWORD=your_password
DB_NAME=appointment_db
DB_PORT=5000
JWT_SECRET=super_secret_key_123
PORT=5000

```

---

## Database Setup Instructions

Before starting the server, you need to create a dedicated MySQL database user with proper privileges.

### 1. Create a MySQL User & Grant Privileges

Open your terminal and log into MySQL as root:

* **Ubuntu / Linux:**
```bash
sudo mysql

```


* **Windows:** Open your MySQL Command Line Client or MySQL Workbench.

Once inside the MySQL prompt, run these commands (replace `your_password` with a secure password of your choice):

```sql
CREATE USER 'app_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON *.* TO 'app_user'@'localhost' WITH GRANT OPTION;
FLUSH PRIVILEGES;
EXIT;

```

(Note: The server code automatically initializes and sets up the required tables—`doctors`, `patients`, `availability_slots`, and `appointments`—upon startup via `dbConnection.js`).

---

## Seed Execution Steps

If you want to populate your database with initial sample data (such as default test doctors, patients, or availability slots), run the provided seed script:

```bash
npm run seed

```

---

## Login Credentials for Doctor and Patient

You can use the following credentials to log in via the Postman `/api/auth/login` endpoint or via your application interface:

### Doctor Account

* **Email:** `doctor1@example.com`
* **Password:** `password123`
* **Role:** `doctor`

### Patient Account

* **Email:** `patient1@example.com`
* **Password:** `password123`
* **Role:** `patient`

---

## Running the Server

* **Start the server (Production mode):**
```bash
npm start

```


* **Start the server with Nodemon (Development mode):**
```bash
npm run dev

```



The server will start listening on port `5000`.

---

## Testing with Postman

1. Locate the Postman collection file inside the repository at:
   `postman/Appointment_System.postman_collection.json`
2. Open **Postman**, click **Import**, and upload the JSON file.
3. Test endpoints sequentially:
* Run **Login User** using the credentials above to acquire your JWT token.
* Copy the returned token and paste it into the `Authorization: Bearer <your_token>` header for protected routes.





