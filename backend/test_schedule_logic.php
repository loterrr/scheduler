<?php
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/src/Env.php'; 
require_once __DIR__ . '/src/Scheduler.php';

use Src\Env;
use Src\Scheduler;

// Load Env
$envPath = __DIR__ . '/.env';
if (file_exists($envPath)) {
    Env::load($envPath);
}

$scheduler = new Scheduler();

// Generate for Term 1
echo "Generating schedule...\n";
$result = $scheduler->generate(1);

// 2. Fetch Schedule and Verify
echo "Fetching schedule...\n";
$schedules = $scheduler->getSchedules();

foreach ($schedules as $s) {
    echo "Subject: " . $s['subject_name'] . " | Teacher: " . $s['teacher_name'] . "\n";
}
