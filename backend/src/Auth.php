<?php
namespace Src;

use Config\Database;
use PDO;

class Auth {
    private $db;
    private $conn;
    private $secret_key;

    public function __construct() {
        $this->db = new Database();
        $this->conn = $this->db->getConnection();
        $this->secret_key = $_ENV['JWT_SECRET'] ?? 'default_secret_key_change_me';
    }

    public function login($data) {
        if (!isset($data->username) || !isset($data->password)) {
            http_response_code(400);
            return ["message" => "Missing username or password"];
        }

        $query = "SELECT id, username, password_hash, role FROM users WHERE username = :username LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":username", $data->username);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if (password_verify($data->password, $row['password_hash'])) {
                
                $userData = [
                    "id" => $row['id'],
                    "username" => $row['username'],
                    "role" => $row['role']
                ];

                if ($row['role'] === 'TEACHER') {
                    $t_query = "SELECT id, name FROM teachers WHERE user_id = :user_id LIMIT 1";
                    $t_stmt = $this->conn->prepare($t_query);
                    $t_stmt->bindParam(":user_id", $row['id']);
                    $t_stmt->execute();
                    if ($t_row = $t_stmt->fetch(PDO::FETCH_ASSOC)) {
                        $userData['teacher_id'] = $t_row['id'];
                        $userData['name'] = $t_row['name'];
                    }
                }

                $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
                $payload = json_encode([
                    "iss" => "scheduler-api",
                    "aud" => "scheduler-app",
                    "iat" => time(),
                    "exp" => time() + (60 * 60 * 24),
                    "data" => $userData
                ]);

                $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
                $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
                $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $this->secret_key, true);
                $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
                $jwt = $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;

                http_response_code(200);
                return [
                    "message" => "Login successful",
                    "token" => $jwt,
                    "user" => $userData
                ];
            }
        }
        
        http_response_code(401);
        return ["message" => "Invalid credentials"];
    }

    public function register($data) {
        if (!isset($data->username) || !isset($data->password) || !isset($data->role)) {
            http_response_code(400);
            return ["message" => "Missing required fields"];
        }

        $check = "SELECT id FROM users WHERE username = :username";
        $stmt = $this->conn->prepare($check);
        $stmt->bindParam(":username", $data->username);
        $stmt->execute();
        if ($stmt->rowCount() > 0) {
             http_response_code(409);
             return ["message" => "Username already exists"];
        }

        $query = "INSERT INTO users (username, password_hash, role) VALUES (:username, :password, :role)";
        $stmt = $this->conn->prepare($query);
        $password_hash = password_hash($data->password, PASSWORD_BCRYPT);
        
        $stmt->bindParam(":username", $data->username);
        $stmt->bindParam(":password", $password_hash);
        $stmt->bindParam(":role", $data->role);

        if ($stmt->execute()) {
            http_response_code(201);
            return ["message" => "User registered successfully"];
        }
        
        http_response_code(500);
        return ["message" => "Registration failed"];
    }

    public function validateToken($token) {
        $parts = explode('.', $token);
        if (count($parts) !== 3) return false;

        $header = $parts[0];
        $payload = $parts[1];
        $signature_provided = $parts[2];

        $signature = hash_hmac('sha256', $header . "." . $payload, $this->secret_key, true);
        $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

        if ($base64UrlSignature === $signature_provided) {
            $data = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $payload)));
            if ($data->exp < time()) return false;
            return $data->data;
        }
        return false;
    }

    public function changePassword($data, $userId) {
        if (!isset($data->current_password) || !isset($data->new_password)) {
            http_response_code(400);
            return ["message" => "Missing current or new password"];
        }

        if (strlen($data->new_password) < 6) {
            http_response_code(400);
            return ["message" => "New password must be at least 6 characters"];
        }

        $query = "SELECT password_hash FROM users WHERE id = :id LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $userId);
        $stmt->execute();

        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            return ["message" => "User not found"];
        }

        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!password_verify($data->current_password, $row['password_hash'])) {
            http_response_code(401);
            return ["message" => "Current password is incorrect"];
        }

        $newHash = password_hash($data->new_password, PASSWORD_BCRYPT);
        $update = "UPDATE users SET password_hash = :hash WHERE id = :id";
        $stmt = $this->conn->prepare($update);
        $stmt->execute(['hash' => $newHash, 'id' => $userId]);

        http_response_code(200);
        return ["message" => "Password changed successfully"];
    }
}
