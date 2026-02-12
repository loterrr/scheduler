<?php
namespace Src;

use Config\Database;
use PDO;

class SubjectController {
    private $db;
    private $conn;

    public function __construct() {
        $this->db = new Database();
        $this->conn = $this->db->getConnection();
    }

    public function getAll() {
        $query = "SELECT s.*, d.name as department_name FROM subjects s LEFT JOIN departments d ON s.department_id = d.id";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function create($data) {
        if (!isset($data->code) || !isset($data->name) || !isset($data->units) || !isset($data->required_hours)) {
             http_response_code(400);
             return ["message" => "Missing required fields"];
        }

        $query = "INSERT INTO subjects (code, name, units, required_hours, room_type_required, department_id) VALUES (:code, :name, :units, :required_hours, :room_type_required, :department_id)";
        $stmt = $this->conn->prepare($query);

        $room_type = isset($data->room_type_required) ? $data->room_type_required : 'ANY';
        $dept_id = isset($data->department_id) ? $data->department_id : null;

        $stmt->bindParam(":code", $data->code);
        $stmt->bindParam(":name", $data->name);
        $stmt->bindParam(":units", $data->units);
        $stmt->bindParam(":required_hours", $data->required_hours);
        $stmt->bindParam(":room_type_required", $room_type);
        $stmt->bindParam(":department_id", $dept_id);

        if ($stmt->execute()) {
            http_response_code(201);
            return ["message" => "Subject created", "id" => $this->conn->lastInsertId()];
        }
        http_response_code(500);
        return ["message" => "Failed to create subject"];
    }

    public function getOne($id) {
        $stmt = $this->conn->prepare("SELECT s.*, d.name as department_name FROM subjects s LEFT JOIN departments d ON s.department_id = d.id WHERE s.id = :id");
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            http_response_code(404);
            return ["message" => "Subject not found"];
        }
        return $row;
    }

    public function update($id, $data) {
        $query = "UPDATE subjects SET code = :code, name = :name, units = :units, required_hours = :required_hours, room_type_required = :room_type WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([
            'code' => $data->code,
            'name' => $data->name,
            'units' => $data->units,
            'required_hours' => $data->required_hours,
            'room_type' => isset($data->room_type_required) ? $data->room_type_required : 'ANY',
            'id' => $id
        ]);
        return ["message" => "Subject updated"];
    }

    public function delete($id) {
        $stmt = $this->conn->prepare("DELETE FROM subjects WHERE id = :id");
        $stmt->execute(['id' => $id]);
        return ["message" => "Subject deleted"];
    }
}
