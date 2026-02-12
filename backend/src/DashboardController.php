<?php
namespace Src;

use Config\Database;
use PDO;

class DashboardController {
    private $db;
    private $conn;

    public function __construct() {
        $this->db = new Database();
        $this->conn = $this->db->getConnection();
    }

    public function getStats() {
        // Count Teachers
        $stmt = $this->conn->prepare("SELECT COUNT(*) as count FROM teachers");
        $stmt->execute();
        $teachers = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

        // Count Subjects
        $stmt = $this->conn->prepare("SELECT COUNT(*) as count FROM subjects");
        $stmt->execute();
        $subjects = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

        // Count Scheduled Classes
        $stmt = $this->conn->prepare("SELECT COUNT(*) as count FROM schedules");
        $stmt->execute();
        $scheduled = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

        // Count Conflicts (unscheduled subjects = subjects not in schedules)
        $stmt = $this->conn->prepare("SELECT COUNT(*) as count FROM subjects WHERE id NOT IN (SELECT DISTINCT subject_id FROM schedules)");
        $stmt->execute();
        $conflicts = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

        return [
            "teachers" => $teachers,
            "subjects" => $subjects,
            "scheduled" => $scheduled,
            "conflicts" => $conflicts
        ];
    }

    public function getConflicts() {
        $conflicts = [];

        // Room double-bookings (shouldn't happen due to UNIQUE constraint, but check)
        $stmt = $this->conn->prepare("
            SELECT s1.id as schedule1_id, s2.id as schedule2_id, r.name as room_name, 
                   s1.day_of_week, s1.start_time, sub1.name as subject1, sub2.name as subject2
            FROM schedules s1
            JOIN schedules s2 ON s1.room_id = s2.room_id AND s1.day_of_week = s2.day_of_week 
                AND s1.start_time = s2.start_time AND s1.id < s2.id AND s1.term_id = s2.term_id
            JOIN rooms r ON s1.room_id = r.id
            JOIN subjects sub1 ON s1.subject_id = sub1.id
            JOIN subjects sub2 ON s2.subject_id = sub2.id
        ");
        $stmt->execute();
        $roomConflicts = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($roomConflicts as $c) {
            $conflicts[] = ["type" => "ROOM_OVERLAP", "detail" => $c];
        }

        // Teacher double-bookings
        $stmt = $this->conn->prepare("
            SELECT s1.id as schedule1_id, s2.id as schedule2_id, t.name as teacher_name,
                   s1.day_of_week, s1.start_time, sub1.name as subject1, sub2.name as subject2
            FROM schedules s1
            JOIN schedules s2 ON s1.teacher_id = s2.teacher_id AND s1.day_of_week = s2.day_of_week 
                AND s1.start_time = s2.start_time AND s1.id < s2.id AND s1.term_id = s2.term_id
            JOIN teachers t ON s1.teacher_id = t.id
            JOIN subjects sub1 ON s1.subject_id = sub1.id
            JOIN subjects sub2 ON s2.subject_id = sub2.id
        ");
        $stmt->execute();
        $teacherConflicts = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($teacherConflicts as $c) {
            $conflicts[] = ["type" => "TEACHER_OVERLAP", "detail" => $c];
        }

        // Unscheduled subjects
        $stmt = $this->conn->prepare("SELECT id, code, name FROM subjects WHERE id NOT IN (SELECT DISTINCT subject_id FROM schedules)");
        $stmt->execute();
        $unscheduled = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($unscheduled as $u) {
            $conflicts[] = ["type" => "UNSCHEDULED", "detail" => $u];
        }

        return $conflicts;
    }
}
