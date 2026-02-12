<?php
namespace Src;

use Config\Database;
use PDO;

class Scheduler {
    private $db;
    private $conn;

    public function __construct() {
        $this->db = new Database();
        $this->conn = $this->db->getConnection();
    }

    /**
     * Create a single schedule entry with conflict validation
     */
    public function createEntry($data) {
        $termId = $data->term_id ?? 1;
        $subjectId = $data->subject_id;
        $teacherId = $data->teacher_id;
        $roomId = $data->room_id;
        $day = $data->day_of_week;
        $startTime = $data->start_time;
        $endTime = $data->end_time ?? date('H:i:s', strtotime($startTime) + 3600);

        // Check room conflict
        $stmt = $this->conn->prepare(
            "SELECT s.id, sub.name as subject_name FROM schedules s 
             JOIN subjects sub ON s.subject_id = sub.id
             WHERE s.term_id = :term_id AND s.room_id = :room_id AND s.day_of_week = :day AND s.start_time = :start_time"
        );
        $stmt->execute(['term_id' => $termId, 'room_id' => $roomId, 'day' => $day, 'start_time' => $startTime]);
        if ($conflict = $stmt->fetch(PDO::FETCH_ASSOC)) {
            http_response_code(409);
            return ['error' => 'Room conflict', 'message' => "Room is already booked for {$conflict['subject_name']} at this time"];
        }

        // Check teacher conflict
        $stmt = $this->conn->prepare(
            "SELECT s.id, sub.name as subject_name FROM schedules s 
             JOIN subjects sub ON s.subject_id = sub.id
             WHERE s.term_id = :term_id AND s.teacher_id = :teacher_id AND s.day_of_week = :day AND s.start_time = :start_time"
        );
        $stmt->execute(['term_id' => $termId, 'teacher_id' => $teacherId, 'day' => $day, 'start_time' => $startTime]);
        if ($conflict = $stmt->fetch(PDO::FETCH_ASSOC)) {
            http_response_code(409);
            return ['error' => 'Teacher conflict', 'message' => "Teacher is already assigned to {$conflict['subject_name']} at this time"];
        }

        // Insert
        $query = "INSERT INTO schedules (term_id, subject_id, teacher_id, room_id, day_of_week, start_time, end_time) 
                  VALUES (:term_id, :subject_id, :teacher_id, :room_id, :day_of_week, :start_time, :end_time)";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([
            'term_id' => $termId,
            'subject_id' => $subjectId,
            'teacher_id' => $teacherId,
            'room_id' => $roomId,
            'day_of_week' => $day,
            'start_time' => $startTime,
            'end_time' => $endTime
        ]);

        $id = $this->conn->lastInsertId();

        // Return the created entry with names
        $stmt = $this->conn->prepare(
            "SELECT s.*, sub.name as subject_name, sub.code as subject_code, t.name as teacher_name, r.name as room_name 
             FROM schedules s
             JOIN subjects sub ON s.subject_id = sub.id
             JOIN teachers t ON s.teacher_id = t.id
             JOIN rooms r ON s.room_id = r.id
             WHERE s.id = :id"
        );
        $stmt->execute(['id' => $id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Delete a single schedule entry
     */
    public function deleteEntry($id) {
        $stmt = $this->conn->prepare("DELETE FROM schedules WHERE id = :id");
        $stmt->execute(['id' => $id]);
        return ['message' => 'Schedule entry deleted'];
    }

    public function getSchedules() {
        $query = "SELECT s.*, sub.name as subject_name, sub.code as subject_code, t.name as teacher_name, r.name as room_name 
                  FROM schedules s
                  JOIN subjects sub ON s.subject_id = sub.id
                  JOIN teachers t ON s.teacher_id = t.id
                  JOIN rooms r ON s.room_id = r.id";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getTeacherSchedules($teacherId) {
        $query = "SELECT s.*, sub.name as subject_name, sub.code as subject_code, t.name as teacher_name, r.name as room_name 
                  FROM schedules s
                  JOIN subjects sub ON s.subject_id = sub.id
                  JOIN teachers t ON s.teacher_id = t.id
                  JOIN rooms r ON s.room_id = r.id
                  WHERE s.teacher_id = :teacher_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":teacher_id", $teacherId);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get subjects with their eligible teachers (for the drag panel)
     */
    public function getSubjectsWithTeachers() {
        $driver = $this->db->getDriver();
        if ($driver === 'pgsql') {
            $query = "SELECT s.*, STRING_AGG(CAST(t.id AS TEXT) || ':' || t.name, '|') as teachers
                      FROM subjects s
                      LEFT JOIN teacher_subjects ts ON s.id = ts.subject_id
                      LEFT JOIN teachers t ON ts.teacher_id = t.id
                      GROUP BY s.id";
        } else {
            $query = "SELECT s.*, GROUP_CONCAT(CONCAT(t.id, ':', t.name) SEPARATOR '|') as teachers
                      FROM subjects s
                      LEFT JOIN teacher_subjects ts ON s.id = ts.subject_id
                      LEFT JOIN teachers t ON ts.teacher_id = t.id
                      GROUP BY s.id";
        }
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Parse the teachers string into array
        foreach ($results as &$row) {
            $teachers = [];
            if ($row['teachers']) {
                foreach (explode('|', $row['teachers']) as $t) {
                    list($id, $name) = explode(':', $t);
                    $teachers[] = ['id' => (int)$id, 'name' => $name];
                }
            }
            $row['teachers'] = $teachers;
        }
        return $results;
    }
}
