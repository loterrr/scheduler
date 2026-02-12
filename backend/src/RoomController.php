<?php
namespace Src;

use Config\Database;
use PDO;

class RoomController {
    private $db;
    private $conn;

    public function __construct() {
        $this->db = new Database();
        $this->conn = $this->db->getConnection();
    }

    public function getAll() {
        $query = "SELECT * FROM rooms";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function create($data) {
        if (!isset($data->name) || !isset($data->capacity) || !isset($data->type)) {
             http_response_code(400);
             return ["message" => "Missing required fields"];
        }

        $query = "INSERT INTO rooms (name, capacity, type, building) VALUES (:name, :capacity, :type, :building)";
        $stmt = $this->conn->prepare($query);

        $building = isset($data->building) ? $data->building : '';

        $stmt->bindParam(":name", $data->name);
        $stmt->bindParam(":capacity", $data->capacity);
        $stmt->bindParam(":type", $data->type);
        $stmt->bindParam(":building", $building);

        if ($stmt->execute()) {
            http_response_code(201);
            return ["message" => "Room created", "id" => $this->conn->lastInsertId()];
        }
        http_response_code(500);
        return ["message" => "Failed to create room"];
    }

    public function getOne($id) {
        $stmt = $this->conn->prepare("SELECT * FROM rooms WHERE id = :id");
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            http_response_code(404);
            return ["message" => "Room not found"];
        }
        return $row;
    }

    public function update($id, $data) {
        $query = "UPDATE rooms SET name = :name, capacity = :capacity, type = :type, building = :building WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([
            'name' => $data->name,
            'capacity' => $data->capacity,
            'type' => $data->type,
            'building' => isset($data->building) ? $data->building : '',
            'id' => $id
        ]);
        return ["message" => "Room updated"];
    }

    public function delete($id) {
        $stmt = $this->conn->prepare("DELETE FROM rooms WHERE id = :id");
        $stmt->execute(['id' => $id]);
        return ["message" => "Room deleted"];
    }
}
