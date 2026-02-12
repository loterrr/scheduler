<?php
namespace Src;

use Config\Database;
use PDO;

class TeacherController {
    private $db;
    private $conn;

    public function __construct() {
        $this->db = new Database();
        $this->conn = $this->db->getConnection();
    }

    public function getAll() {
        $query = "SELECT t.*, d.name as department_name FROM teachers t LEFT JOIN departments d ON t.department_id = d.id";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getOne($id) {
        $query = "SELECT t.*, d.name as department_name FROM teachers t LEFT JOIN departments d ON t.department_id = d.id WHERE t.id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            http_response_code(404);
            return ["message" => "Teacher not found"];
        }
        return $row;
    }

    public function create($data) {
        // Validate
        if (!isset($data->name) || !isset($data->max_load_units)) {
             http_response_code(400);
             return ["message" => "Missing required fields"];
        }

        try {
            $this->conn->beginTransaction();

            // 1. Create User Account
            // Generate username/password if not provided
            $username = strtolower(str_replace(' ', '', $data->name)); // Simple generation
            $password = "password"; // Default password
            $password_hash = password_hash($password, PASSWORD_BCRYPT);
            
            $u_query = "INSERT INTO users (username, password_hash, role) VALUES (:username, :password, :role)";
            $u_stmt = $this->conn->prepare($u_query);
            $role = 'TEACHER';
            $u_stmt->bindParam(":username", $username);
            $u_stmt->bindParam(":password", $password_hash);
            $u_stmt->bindParam(":role", $role);
            
            if (!$u_stmt->execute()) {
                throw new \Exception("Failed to create user account");
            }
            $user_id = $this->conn->lastInsertId();

            // 2. Create Teacher Profile
            $query = "INSERT INTO teachers (user_id, name, department_id, is_full_time, max_load_units) VALUES (:user_id, :name, :department_id, :is_full_time, :max_load_units)";
            $stmt = $this->conn->prepare($query);
            
            $is_full_time = isset($data->is_full_time) ? $data->is_full_time : 1;
            $department_id = isset($data->department_id) ? $data->department_id : null;

            $stmt->bindParam(":user_id", $user_id);
            $stmt->bindParam(":name", $data->name);
            $stmt->bindParam(":department_id", $department_id);
            $stmt->bindParam(":is_full_time", $is_full_time);
            $stmt->bindParam(":max_load_units", $data->max_load_units);

            if (!$stmt->execute()) {
                throw new \Exception("Failed to create teacher profile");
            }
            $teacher_id = $this->conn->lastInsertId();

            $this->conn->commit();

            http_response_code(201);
            return [
                "message" => "Teacher created successfully",
                "id" => $teacher_id,
                "user" => [
                    "username" => $username,
                    "default_password" => $password
                ]
            ];

        } catch (\Exception $e) {
            $this->conn->rollBack();
            http_response_code(500);
            return ["message" => "Failed to create teacher: " . $e->getMessage()];
        }
    }

    public function update($id, $data) {
        $query = "UPDATE teachers SET name = :name, max_load_units = :max_load_units, is_full_time = :is_full_time WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([
            'name' => $data->name,
            'max_load_units' => $data->max_load_units,
            'is_full_time' => isset($data->is_full_time) ? $data->is_full_time : 1,
            'id' => $id
        ]);
        return ["message" => "Teacher updated"];
    }

    public function delete($id) {
        // Also delete the linked user account
        $stmt = $this->conn->prepare("SELECT user_id FROM teachers WHERE id = :id");
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        $stmt = $this->conn->prepare("DELETE FROM teachers WHERE id = :id");
        $stmt->execute(['id' => $id]);

        if ($row && $row['user_id']) {
            $stmt = $this->conn->prepare("DELETE FROM users WHERE id = :id");
            $stmt->execute(['id' => $row['user_id']]);
        }

        return ["message" => "Teacher deleted"];
    }
}
