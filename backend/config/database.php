<?php
namespace Config;

use PDO;
use PDOException;

class Database {
    private $host;
    private $port;
    private $db_name;
    private $username;
    private $password;
    private $driver;
    public $conn;

    public function __construct() {
        $this->host = $_ENV['DB_HOST'] ?? 'localhost';
        $this->port = $_ENV['DB_PORT'] ?? '';
        $this->db_name = $_ENV['DB_NAME'] ?? 'scheduler_db';
        $this->username = $_ENV['DB_USER'] ?? 'root';
        $this->password = $_ENV['DB_PASS'] ?? '';
        $this->driver = $_ENV['DB_DRIVER'] ?? 'mysql'; // 'mysql' or 'pgsql'
    }

    public function getConnection() {
        $this->conn = null;
        try {
            if ($this->driver === 'pgsql') {
                $port = $this->port ?: '5432';
                $dsn = "pgsql:host={$this->host};port={$port};dbname={$this->db_name};sslmode=require";
                $this->conn = new PDO($dsn, $this->username, $this->password);
            } else {
                $port = $this->port ? ";port={$this->port}" : '';
                $dsn = "mysql:host={$this->host}{$port};dbname={$this->db_name}";
                $this->conn = new PDO($dsn, $this->username, $this->password);
                $this->conn->exec("set names utf8");
            }
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch(PDOException $exception) {
            echo "Connection error: " . $exception->getMessage();
        }
        return $this->conn;
    }

    public function getDriver() {
        return $this->driver;
    }
}
