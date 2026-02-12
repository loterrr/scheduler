<?php
namespace Src;

use Config\Database;
use PDO;

class AvailabilityController {
    private $conn;

    public function __construct() {
        $db = new Database();
        $this->conn = $db->getConnection();
    }

    public function getByTeacher($teacherId) {
        $stmt = $this->conn->prepare("SELECT * FROM teacher_availability WHERE teacher_id = :tid ORDER BY FIELD(day_of_week, 'MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY'), start_time");
        $stmt->execute(['tid' => $teacherId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function save($teacherId, $data) {
        // Expects $data->slots = [ { day_of_week, start_time, end_time }, ... ]
        if (!isset($data->slots) || !is_array($data->slots)) {
            http_response_code(400);
            return ["message" => "Missing slots array"];
        }

        $this->conn->beginTransaction();
        try {
            // Clear old availability
            $del = $this->conn->prepare("DELETE FROM teacher_availability WHERE teacher_id = :tid");
            $del->execute(['tid' => $teacherId]);

            // Insert new
            $ins = $this->conn->prepare("INSERT INTO teacher_availability (teacher_id, day_of_week, start_time, end_time) VALUES (:tid, :day, :start, :end)");
            foreach ($data->slots as $slot) {
                $ins->execute([
                    'tid' => $teacherId,
                    'day' => $slot->day_of_week,
                    'start' => $slot->start_time,
                    'end' => $slot->end_time
                ]);
            }

            $this->conn->commit();
            return ["message" => "Availability saved", "count" => count($data->slots)];
        } catch (\Exception $e) {
            $this->conn->rollBack();
            http_response_code(500);
            return ["message" => "Failed to save availability: " . $e->getMessage()];
        }
    }
}
