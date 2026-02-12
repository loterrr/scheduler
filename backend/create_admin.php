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

$username = 'admin';
$password = 'admin123';
$hash = password_hash($password, PASSWORD_BCRYPT);

// Insert or update
$stmt = $conn->prepare("SELECT id FROM users WHERE username = :u");
$stmt->execute(['u' => $username]);

if ($stmt->fetch()) {
    $conn->prepare("UPDATE users SET password_hash = :h WHERE username = :u")
         ->execute(['h' => $hash, 'u' => $username]);
    echo "Admin password reset.\n";
} else {
    $conn->prepare("INSERT INTO users (username, password_hash, role) VALUES (:u, :h, 'ADMIN')")
         ->execute(['u' => $username, 'h' => $hash]);
    echo "Admin account created.\n";
}

echo "Username: $username\nPassword: $password\n";
