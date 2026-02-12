<?php
namespace Src;

use Config\Database;
use PDO;

class TermController {
    private $conn;

    public function __construct() {
        $db = new Database();
        $this->conn = $db->getConnection();
    }

    public function getAll() {
        $stmt = $this->conn->prepare("SELECT * FROM academic_terms ORDER BY start_date DESC");
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function create($data) {
        if (!isset($data->name) || !isset($data->start_date) || !isset($data->end_date)) {
            http_response_code(400);
            return ["message" => "Missing required fields"];
        }

        $query = "INSERT INTO academic_terms (name, start_date, end_date, is_active) VALUES (:name, :start_date, :end_date, :is_active)";
        $stmt = $this->conn->prepare($query);
        $isActive = isset($data->is_active) ? $data->is_active : 0;
        $stmt->execute([
            'name' => $data->name,
            'start_date' => $data->start_date,
            'end_date' => $data->end_date,
            'is_active' => $isActive
        ]);

        http_response_code(201);
        return ["message" => "Term created", "id" => $this->conn->lastInsertId()];
    }

    public function update($id, $data) {
        $query = "UPDATE academic_terms SET name = :name, start_date = :start_date, end_date = :end_date WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([
            'name' => $data->name,
            'start_date' => $data->start_date,
            'end_date' => $data->end_date,
            'id' => $id
        ]);
        return ["message" => "Term updated"];
    }

    public function delete($id) {
        $stmt = $this->conn->prepare("DELETE FROM academic_terms WHERE id = :id");
        $stmt->execute(['id' => $id]);
        return ["message" => "Term deleted"];
    }

    public function setActive($id) {
        $this->conn->exec("UPDATE academic_terms SET is_active = 0");
        $stmt = $this->conn->prepare("UPDATE academic_terms SET is_active = 1 WHERE id = :id");
        $stmt->execute(['id' => $id]);
        return ["message" => "Term activated"];
    }
}
