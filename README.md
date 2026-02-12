# Teacher/Professor Subject & Class Scheduler (PHP + MySQL + Next.js)

A comprehensive web-based system for assigning subjects to teachers, generating class schedules automatically with conflict detection, and monitoring resource utilization.

## Tech Stack

- **Backend:** PHP (Vanilla/Native), MySQL, PDO, Firebase JWT
- **Frontend:** Next.js, TailwindCSS, Axios, Chart.js
- **Database:** MySQL

## Prerequisites

- PHP 8.0+
- Composer
- MySQL 5.7+ or MariaDB
- Node.js 16+ & npm

## Setup Instructions

### 1. Database Setup
1. Create a MySQL database named `scheduler_db`.
2. Import the schema:
   ```bash
   mysql -u root -p scheduler_db < backend/schema.sql
   ```

### 2. Backend Setup
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install PHP dependencies:
   ```bash
   composer install
   ```
3. Update database credentials in `config/database.php` if necessary.
4. Start the PHP development server:
   ```bash
   php -S localhost:8000
   ```
   *The API will be available at http://localhost:8000*

### 3. Frontend Setup
1. Navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   *The application will be running at http://localhost:3000*

## Features

- **Teacher Management:** Add and list teachers with workload limits.
- **Subject Management:** Define subjects with required hours and room types.
- **Room Management:** (API Implemented) Manage class rooms and capacity.
- **Automatic Scheduling:** Greedy algorithm to assign classes while checking for:
    - Teacher conflicts (double booking)
    - Room conflicts
    - Room type requirements
- **Dashboard:** View statistics (Teachers, Subjects, Scheduled Classes).

## API Endpoints

- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET/POST /api/teachers`
- `GET/POST /api/subjects`
- `GET/POST /api/rooms`
- `POST /api/schedules/generate`
- `GET /api/schedules`
