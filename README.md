


# Appointment System - Backend Server (Test Assignment)

A robust Node.js and Express backend API for the Doctor Appointment System, featuring MySQL database integration, JWT-based authentication, request duration logging middleware, and Postman collection support.

---

## Key Features of the Backend Server

* **MySQL Database Integration & Auto-Initialization**: Automatically provisions and verifies all required tables (`doctors`, `patients`, `availability_slots`, and `appointments`) upon server startup using a robust retry-enabled connection layer.
* **Role-Based Authentication & Registration**: Secure signup and login mechanisms for both **Patients** and **Doctors**, issuing a JSON Web Token (JWT) upon successful authentication or account creation.
* **Role-Based Authorization & Protected Routes**: Subsequent API requests require the JWT token passed via headers (`Authorization: Bearer <token>`). Middleware verifies the token, user ID, and role to ensure users only access the endpoints permitted for their specific profile.
* **Doctor Management API**: Enables doctors to securely manage professional profile data, add/remove availability slots, and view, complete, or cancel scheduled patient appointments.
* **Patient Management & Booking API**: Allows patients to search for doctors, view slot details, book appointments, check personal appointment history, and cancel appointments.
* **High-Resolution Request Logging Middleware**: Tracks request durations down to milliseconds with precise IST timestamps and automated error response logging for robust debugging.
* **Postman Collection Support**: Includes a ready-to-import Postman collection (`postman/Appointment_System.postman_collection.json`) to easily test all endpoints.
---

## 📺 Demo Video
A complete walkthrough and screen recording of the application features can be viewed here:
> [🔗 Watch Project Demo on Google Drive](https://drive.google.com/file/d/1NssWd2c0Z9FhXf_c3bCmFVdu83LS1iyZ/view)

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Project Setup Steps](#project-setup-steps)
3. [Environment Variables Required](#environment-variables-required)
4. [Database Server Setup Instructions](#database--server-setup-instructions)
5. [Testing with Postman](#testing-with-postman)

---

## Prerequisites

Make sure you have the following installed on your local machine:
* **Node.js** (v18 or higher recommended)
* **MySQL Server** (Running locally on port 3306)

---

## Project Setup Steps

**Install project dependencies:**
```bash
npm install

```



---

## Environment Variables Required

Create a file named **`.env`** in the root of the `appointment-backend` folder and add the following configuration variables:

```env
DB_HOST=localhost
DB_USER=app_user
DB_PASSWORD=your_password
DB_NAME=appointment_db
DB_PORT=3306
PORT=5000
JWT_SECRET=super_secret_key_123

```

---

## Database & Server Setup Instructions

You can run the backend server either **locally on your host machine** or **containerized via Docker Compose**.

---

### Option A: Running via Docker & Docker Compose (Recommended)

Docker handles the MySQL database setup and environment configuration automatically without requiring a native MySQL installation on your host system.

Start the application and database containers in the background using Docker Compose:
```bash
docker compose up --build -d

```



*(Note: The server code automatically initializes and sets up the required tables—`doctors`, `patients`, `availability_slots`, and `appointments`—upon startup via `dbConnection.js`).*

---

### Option B: Running Locally (Native Setup)

If you prefer running the server and database directly on your host machine:

#### 1. Create a MySQL User & Grant Privileges

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

#### 2. Start the Server

Ensure your local `.env` file points `DB_HOST=localhost`, then start the server:

* **Start the server (Production mode):**

```bash
npm start

```

* **Start the server with Nodemon (Development mode):**

```bash
npm run dev

```

The server will start listening on port `5000`.

## Testing with Postman

1. Locate the Postman collection file inside the repository at:
   `postman/Appointment_System.postman_collection.json`
2. Open **Postman**, click **Import**, and upload the JSON file.
3. Test endpoints sequentially:
* Run **Login User** using the credentials above to acquire your JWT token.
* Copy the returned token and paste it into the `Authorization: Bearer <your_token>` header for protected routes.


---

## Known Limitations & Deployment Notes

* **Local & Containerized Scope**: While the application is fully containerized using Docker and Docker Compose for seamless execution, cloud-hosted deployment was intentionally kept local to avoid setting up paid billing accounts or virtual machine instances for a test assignment project.



