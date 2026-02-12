<?php
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/src/Env.php'; // Manually include since no autoloader here yet

use Config\Database;
use Src\Env;

// Load Env
$envPath = __DIR__ . '/.env';
if (file_exists($envPath)) {
    Env::load($envPath);
}

$db = new Database();
$conn = $db->getConnection();

if (!$conn) {
    die("Stopping seed script due to connection error.\n");
}

echo "Seeding database...\n";

// Helper to create user
function createUser($conn, $username, $password, $role) {
    $stmt = $conn->prepare("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)");
    $hash = password_hash($password, PASSWORD_BCRYPT);
    try {
        $stmt->execute([$username, $hash, $role]);
        return $conn->lastInsertId();
    } catch (PDOException $e) {
        // If exists, try to get ID
        $stmt = $conn->prepare("SELECT id FROM users WHERE username = ?");
        $stmt->execute([$username]);
        if ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            return $row['id'];
        }
    }
    return null;
}

// 0. Admin User
$adminId = createUser($conn, 'admin', 'admin123', 'ADMIN');
echo "Admin user created/verified (user: admin, pass: admin123)\n";

// 1. Academic Terms
$terms = [
    ['Fall 2023', '2023-09-01', '2023-12-15', 1]
];
$stmt = $conn->prepare("INSERT INTO academic_terms (name, start_date, end_date, is_active) VALUES (?, ?, ?, ?)");
foreach ($terms as $t) {
    try {
        $stmt->execute($t);
        echo "Added term: {$t[0]}\n";
    } catch (PDOException $e) {}
}

// 2. Teachers (Create User first)
$teachers = [
    ['John Doe', 18, 1],
    ['Jane Smith', 15, 1],
    ['Robert Brown', 12, 0],
    ['Emily White', 21, 1],
    ['Michael Green', 9, 0],
    ['Sarah Black', 15, 1],
    ['David Wilson', 18, 1],
    ['Jennifer Lee', 12, 0]
];

$stmt = $conn->prepare("INSERT INTO teachers (user_id, name, max_load_units, is_full_time) VALUES (?, ?, ?, ?)");

foreach ($teachers as $t) {
    $name = $t[0];
    $username = strtolower(str_replace(' ', '', $name));
    $userId = createUser($conn, $username, 'password', 'TEACHER');
    
    if ($userId) {
        try {
            $stmt->execute([$userId, $name, $t[1], $t[2]]);
            echo "Added teacher: $name (user: $username, pass: password)\n";
        } catch (PDOException $e) {
             // likely exists
        }
    }
}

// 3. Subjects
$subjects = [
    ['CS101', 'Intro to Computing', 3, 3, 'LECTURE'],
    ['CS102', 'Programming I', 3, 5, 'LAB'],
    ['CS103', 'Discrete Math', 3, 3, 'LECTURE'],
    ['ENG101', 'Purposive Comm', 3, 3, 'LECTURE'],
    ['MATH101', 'Calculus I', 3, 3, 'LECTURE'],
    ['PE101', 'Physical Fitness', 2, 2, 'LECTURE'],
    ['CS201', 'Data Structures', 3, 5, 'LAB'],
    ['CS202', 'Algorithms', 3, 3, 'LECTURE']
];

$stmt = $conn->prepare("INSERT INTO subjects (code, name, units, required_hours, room_type_required) VALUES (?, ?, ?, ?, ?)");
foreach ($subjects as $s) {
    try {
        $stmt->execute($s);
        echo "Added subject: {$s[0]}\n";
    } catch (PDOException $e) {}
}

// 4. Rooms
$rooms = [
    ['Rm 101', 40, 'LECTURE'],
    ['Rm 102', 40, 'LECTURE'],
    ['Lab A', 30, 'LAB'],
    ['Lab B', 30, 'LAB'],
    ['AVR', 100, 'LECTURE']
];

$stmt = $conn->prepare("INSERT INTO rooms (name, capacity, type) VALUES (?, ?, ?)");
foreach ($rooms as $r) {
    try {
        $stmt->execute($r);
        echo "Added room: {$r[0]}\n";
    } catch (PDOException $e) {}
}

// 5. Run Migrations (Add teacher_subjects)
$migrationSql = file_get_contents(__DIR__ . '/migrations/001_add_teacher_subjects.sql');
$conn->exec($migrationSql);
echo "Applied migrations.\n";

// 6. Assign Subjects to Teachers
$assignments = [
    // Teacher Name -> [Subject Codes]
    'John Doe' => ['CS101', 'CS102', 'CS201'],
    'Jane Smith' => ['MATH101', 'CS103'],
    'Robert Brown' => ['CS202', 'CS103'],
    'Emily White' => ['ENG101'],
    'Michael Green' => ['PE101'],
    'Sarah Black' => ['CS101', 'CS102'],
    'David Wilson' => ['MATH101'],
    'Jennifer Lee' => ['CS201']
];

$stmt = $conn->prepare("INSERT IGNORE INTO teacher_subjects (teacher_id, subject_id) VALUES (?, ?)");
$getTeacher = $conn->prepare("SELECT id FROM teachers WHERE name = ?");
$getSubject = $conn->prepare("SELECT id FROM subjects WHERE code = ?");

foreach ($assignments as $teacherName => $codes) {
    $getTeacher->execute([$teacherName]);
    $tid = $getTeacher->fetchColumn();
    
    if ($tid) {
        foreach ($codes as $code) {
            $getSubject->execute([$code]);
            $sid = $getSubject->fetchColumn();
            if ($sid) {
                $stmt->execute([$tid, $sid]);
                // echo "Assigned $codes to $teacherName\n"; 
            }
        }
    }
}
echo "Assigned subjects to teachers.\n";

echo "Database seeding complete!\n";
