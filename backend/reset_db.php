<?php
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/src/Env.php';

use Config\Database;
use Src\Env;

$envPath = __DIR__ . '/.env';
if (file_exists($envPath)) {
    Env::load($envPath);
}

$db = new Database();
$conn = $db->getConnection();

if (!$conn) {
    die("Database connection failed.\n");
}

echo "Resetting database — clearing all records...\n";

// Disable FK checks so we can truncate in any order
$conn->exec("SET FOREIGN_KEY_CHECKS = 0");

$tables = [
    'schedules',
    'teacher_availability',
    'teacher_subjects',
    'teachers',
    'subjects',
    'rooms',
    'academic_terms',
    'departments',
    'users',
];

foreach ($tables as $table) {
    try {
        $conn->exec("TRUNCATE TABLE $table");
        echo "  ✓ Cleared: $table\n";
    } catch (PDOException $e) {
        echo "  ✗ Skipped: $table ({$e->getMessage()})\n";
    }
}

$conn->exec("SET FOREIGN_KEY_CHECKS = 1");

echo "\nDone! All tables are empty. Run 'php mock_data.php' to re-seed.\n";
