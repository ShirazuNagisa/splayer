<?php
/**
 * SPlayer Standalone API
 * 
 * Lightweight backend for SPlayer standalone mode.
 * Usage: Place in your web root or a PHP-supported directory.
 *
 * Endpoints:
 *   GET  api.php?action=playlist          — Get playlist
 *   POST api.php?action=playlist          — Save playlist
 *   GET  api.php?action=check-update      — Check for updates (GitHub)
 */

// Allow CORS (for development with Live Server etc.)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ---- Configuration ----
define('DATA_DIR', __DIR__ . '/data');
define('PLAYLIST_FILE', DATA_DIR . '/playlist.json');
define('GITHUB_REPO', 'https://api.github.com/repos/ShirazuNagisa/splayer');

// Ensure data directory exists
if (!is_dir(DATA_DIR)) {
    mkdir(DATA_DIR, 0755, true);
}

// ---- Routing ----
$action = isset($_GET['action']) ? $_GET['action'] : '';

switch ($action) {
    case 'playlist':
        handle_playlist();
        break;
    case 'check-update':
        handle_check_update();
        break;
    default:
        json_response(['error' => 'Unknown action', 'available_actions' => ['playlist', 'check-update']], 400);
}

// ---- Handlers ----

function handle_playlist() {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $data = file_exists(PLAYLIST_FILE) ? json_decode(file_get_contents(PLAYLIST_FILE), true) : [];
        json_response(['success' => true, 'playlist' => is_array($data) ? $data : []]);
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        $playlist = isset($input['playlist']) ? $input['playlist'] : [];

        if (!is_array($playlist)) {
            json_response(['error' => 'Invalid playlist data'], 400);
            return;
        }

        file_put_contents(PLAYLIST_FILE, json_encode($playlist, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        json_response(['success' => true, 'message' => 'Playlist saved']);
    } else {
        json_response(['error' => 'Method not allowed'], 405);
    }
}

function handle_check_update() {
    $url = GITHUB_REPO . '/releases/latest';

    $opts = [
        'http' => [
            'method' => 'GET',
            'header' => "Accept: application/vnd.github.v3+json\r\nUser-Agent: SPlayer-Standalone\r\n",
            'timeout' => 15,
        ]
    ];
    $context = stream_context_create($opts);
    $response = @file_get_contents($url, false, $context);

    if ($response === false) {
        json_response(['error' => 'Failed to fetch update info'], 500);
        return;
    }

    $http_code = 0;
    if (isset($http_response_header[0])) {
        preg_match('/\d{3}/', $http_response_header[0], $m);
        $http_code = isset($m[0]) ? (int)$m[0] : 0;
    }

    if ($http_code !== 200) {
        json_response(['error' => 'GitHub API returned status code: ' . $http_code], 500);
        return;
    }

    $data = json_decode($response, true);

    if (empty($data['tag_name'])) {
        json_response(['error' => 'Could not parse version'], 500);
        return;
    }

    $version = ltrim($data['tag_name'], 'v');
    $download_url = !empty($data['zipball_url']) ? $data['zipball_url'] : (!empty($data['html_url']) ? $data['html_url'] : '');
    $changelog = '';
    if (!empty($data['body'])) {
        $changelog = strip_tags($data['body']);
        if (mb_strlen($changelog) > 500) {
            $changelog = mb_substr($changelog, 0, 500) . '...';
        }
    }

    // Read current version from splayer.js header (fallback) or from a local version file
    $currentVersion = '0.0.0';
    $versionFile = __DIR__ . '/version.txt';
    if (file_exists($versionFile)) {
        $currentVersion = trim(file_get_contents($versionFile));
    }

    json_response([
        'success' => true,
        'current_version' => $currentVersion,
        'latest_version' => $version,
        'download_url' => $download_url,
        'changelog' => $changelog,
        'has_update' => version_compare($version, $currentVersion, '>'),
    ]);
}

// ---- Utilities ----

function json_response($data, $status = 200) {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}