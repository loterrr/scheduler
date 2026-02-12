<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: OPTIONS,GET,POST,PUT,DELETE");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Simple Autoloader for non-composer setup
spl_autoload_register(function ($class_name) {
    // Convert namespace to full file path
    $file = __DIR__ . '/' . str_replace('\\', '/', $class_name) . '.php';
    if (file_exists($file)) {
        require_once $file;
    }
});

// Load Env
$envPath = __DIR__ . '/.env';
if (file_exists($envPath)) {
    Src\Env::load($envPath);
}


$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = explode( '/', $uri );

// Router
$method = $_SERVER['REQUEST_METHOD'];

// Parse input
$input = json_decode(file_get_contents("php://input"));

if (isset($uri[2]) && $uri[2] === 'status') {
    echo json_encode(["status" => "API is running", "timestamp" => date('c')]);
    exit();
}

if (isset($uri[2]) && $uri[2] === 'auth') {
    $auth = new Src\Auth();
    if (isset($uri[3]) && $uri[3] === 'login' && $method === 'POST') {
        echo json_encode($auth->login($input));
        exit();
    }
    if (isset($uri[3]) && $uri[3] === 'register' && $method === 'POST') {
        echo json_encode($auth->register($input));
        exit();
    }
    if (isset($uri[3]) && $uri[3] === 'password' && $method === 'PUT') {
        $authHeader = isset($_SERVER['HTTP_AUTHORIZATION']) ? $_SERVER['HTTP_AUTHORIZATION'] : '';
        $token = str_replace('Bearer ', '', $authHeader);
        $userData = $auth->validateToken($token);
        if (!$userData) {
            http_response_code(401);
            echo json_encode(["message" => "Unauthorized"]);
            exit();
        }
        echo json_encode($auth->changePassword($input, $userData->id));
        exit();
    }
}

// Terms Routes
if (isset($uri[2]) && $uri[2] === 'terms') {
    $controller = new Src\TermController();
    if ($method === 'GET') {
        echo json_encode($controller->getAll());
    } elseif ($method === 'POST') {
        echo json_encode($controller->create($input));
    } elseif ($method === 'PUT' && isset($uri[3])) {
        if (isset($uri[4]) && $uri[4] === 'activate') {
            echo json_encode($controller->setActive($uri[3]));
        } else {
            echo json_encode($controller->update($uri[3], $input));
        }
    } elseif ($method === 'DELETE' && isset($uri[3])) {
        echo json_encode($controller->delete($uri[3]));
    }
    exit();
}

// Departments Routes
if (isset($uri[2]) && $uri[2] === 'departments') {
    $db = new Config\Database();
    $conn = $db->getConnection();
    if ($method === 'GET') {
        $stmt = $conn->prepare("SELECT * FROM departments ORDER BY name");
        $stmt->execute();
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    } elseif ($method === 'POST') {
        $stmt = $conn->prepare("INSERT INTO departments (name, code) VALUES (:name, :code)");
        $code = strtoupper(substr(preg_replace('/[^a-zA-Z]/', '', $input->name), 0, 10));
        $stmt->execute(['name' => $input->name, 'code' => $code]);
        echo json_encode(['id' => $conn->lastInsertId(), 'name' => $input->name, 'code' => $code]);
    }
    exit();
}

// Teachers Routes
if (isset($uri[2]) && $uri[2] === 'teachers') {
    $controller = new Src\TeacherController();
    if (isset($uri[3]) && isset($uri[4]) && $uri[4] === 'availability') {
        $avail = new Src\AvailabilityController();
        if ($method === 'GET') {
            echo json_encode($avail->getByTeacher($uri[3]));
        } elseif ($method === 'POST') {
            echo json_encode($avail->save($uri[3], $input));
        }
        exit();
    }
    if ($method === 'GET') {
        if (isset($uri[3])) {
             echo json_encode($controller->getOne($uri[3]));
        } else {
             echo json_encode($controller->getAll());
        }
    } elseif ($method === 'POST') {
        echo json_encode($controller->create($input));
    } elseif ($method === 'PUT' && isset($uri[3])) {
        echo json_encode($controller->update($uri[3], $input));
    } elseif ($method === 'DELETE' && isset($uri[3])) {
        echo json_encode($controller->delete($uri[3]));
    }
    exit();
}

// Subjects Routes
if (isset($uri[2]) && $uri[2] === 'subjects') {
    $controller = new Src\SubjectController();
    if ($method === 'GET') {
        if (isset($uri[3])) {
            echo json_encode($controller->getOne($uri[3]));
        } else {
            echo json_encode($controller->getAll());
        }
    } elseif ($method === 'POST') {
        echo json_encode($controller->create($input));
    } elseif ($method === 'PUT' && isset($uri[3])) {
        echo json_encode($controller->update($uri[3], $input));
    } elseif ($method === 'DELETE' && isset($uri[3])) {
        echo json_encode($controller->delete($uri[3]));
    }
    exit();
}

// Rooms Routes
if (isset($uri[2]) && $uri[2] === 'rooms') {
    $controller = new Src\RoomController();
    if ($method === 'GET') {
        if (isset($uri[3])) {
            echo json_encode($controller->getOne($uri[3]));
        } else {
            echo json_encode($controller->getAll());
        }
    } elseif ($method === 'POST') {
        echo json_encode($controller->create($input));
    } elseif ($method === 'PUT' && isset($uri[3])) {
        echo json_encode($controller->update($uri[3], $input));
    } elseif ($method === 'DELETE' && isset($uri[3])) {
        echo json_encode($controller->delete($uri[3]));
    }
    exit();
}

// Schedules Routes
if (isset($uri[2]) && $uri[2] === 'schedules') {
    $controller = new Src\Scheduler();
    if (isset($uri[3]) && $uri[3] === 'subjects' && $method === 'GET') {
        echo json_encode($controller->getSubjectsWithTeachers());
    } elseif ($method === 'POST') {
        echo json_encode($controller->createEntry($input));
    } elseif ($method === 'DELETE' && isset($uri[3])) {
        echo json_encode($controller->deleteEntry($uri[3]));
    } elseif ($method === 'GET') {
        echo json_encode($controller->getSchedules());
    }
    exit();
}

// Dashboard Routes
if (isset($uri[2]) && $uri[2] === 'dashboard') {
    $controller = new Src\DashboardController();
    if (isset($uri[3]) && $uri[3] === 'stats' && $method === 'GET') {
        echo json_encode($controller->getStats());
    } elseif (isset($uri[3]) && $uri[3] === 'conflicts' && $method === 'GET') {
        echo json_encode($controller->getConflicts());
    }
    exit();
}

// Portal Routes
if (isset($uri[2]) && $uri[2] === 'portal' && isset($uri[3]) && $uri[3] === 'schedule') {
    // Auth Check
    $authHeader = isset($_SERVER['HTTP_AUTHORIZATION']) ? $_SERVER['HTTP_AUTHORIZATION'] : '';
    $token = str_replace('Bearer ', '', $authHeader);
    
    $auth = new Src\Auth();
    $userData = $auth->validateToken($token);

    if (!$userData || $userData->role !== 'TEACHER') {
        http_response_code(401);
        echo json_encode(["message" => "Unauthorized"]);
        exit();
    }

    if (!isset($userData->teacher_id)) {
        http_response_code(403);
        echo json_encode(["message" => "User is not linked to a teacher profile"]);
        exit();
    }

    $controller = new Src\Scheduler();
    echo json_encode($controller->getTeacherSchedules($userData->teacher_id));
    exit();
}

// Fallback
http_response_code(404);
echo json_encode(["message" => "Endpoint not found"]);
