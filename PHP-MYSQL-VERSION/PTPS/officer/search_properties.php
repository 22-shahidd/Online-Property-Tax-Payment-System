<?php
// This file serves two purposes:
//  1. As a full page (no query string) -> shows the AJAX search box (officer navigates here via sidebar).
//  2. As an AJAX endpoint (?q=...) -> echoes an HTML table of matching rows (the syllabus getuser_search.php pattern).
include '../db.php';

$q = isset($_GET['q']) ? mysqli_real_escape_string($con, $_GET['q']) : "";

// AJAX endpoint mode: if q is present (even empty), return rows
if (isset($_GET['q'])) {
    if ($q == "") {
        exit;
    }
    $sql = "SELECT p.pid, p.tno, p.address, p.ptype, p.areasq, p.cyear, p.status,
                   u.uname AS owner, w.wardno, w.zone
            FROM propertymaster p
            JOIN usermaster u ON p.uid=u.uid
            JOIN wardmaster w ON p.wid=w.wid
            WHERE p.tno LIKE '%$q%' OR u.uname LIKE '%$q%'
            ORDER BY p.pid DESC
            LIMIT 20";
    $result = mysqli_query($con, $sql);
    if (mysqli_num_rows($result) == 0) {
        echo "<p class='muted' style='padding:12px;'>No matching properties found.</p>";
        exit;
    }
    echo "<table><thead><tr>
        <th>ID</th><th>Tenement No</th><th>Owner</th><th>Ward</th>
        <th>Address</th><th>Type</th><th>Area</th><th>Built</th><th>Status</th>
    </tr></thead><tbody>";
    while ($row = mysqli_fetch_array($result)) {
        $badge = "badge-" . $row['status'];
        echo "<tr>
            <td>{$row['pid']}</td><td>{$row['tno']}</td><td>{$row['owner']}</td>
            <td>{$row['wardno']} ({$row['zone']})</td>
            <td>{$row['address']}</td><td>{$row['ptype']}</td>
            <td>{$row['areasq']}</td><td>{$row['cyear']}</td>
            <td><span class='badge $badge'>{$row['status']}</span></td>
        </tr>";
    }
    echo "</tbody></table>";
    exit;
}

// Full page mode
session_start();
if (!isset($_SESSION['uid'])) { header("Location: ../index.php"); exit; }
if ($_SESSION['urole'] !== 'officer') { header("Location: ../index.php"); exit; }
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Search Properties - Nagarpalika</title>
    <link rel="stylesheet" href="../css/style.css">
</head>
<body>
<div class="topbar">
    <div class="brand">Nagarpalika <span>Property Tax</span></div>
    <div class="user-info">
        Officer: <?php echo $_SESSION['uname']; ?>
        <a href="../logout.php">Logout</a>
    </div>
</div>
<div class="layout">
    <div class="sidebar">
        <div class="side-label">Officer</div>
        <a href="dashboard.php">Dashboard</a>
        <a href="verify_properties.php">Verify Properties</a>
        <a href="search_properties.php" class="active">Search Properties</a>
        <a href="offline_payment.php">Offline Payment</a>
        <a href="grievances.php">Grievances</a>
    </div>
    <div class="main">
        <h1 class="page-title">Search Properties (AJAX)</h1>

        <div class="panel">
            <div class="panel-header">Real-time Search</div>
            <div class="search-box">
                <input type="text" oninput="searchProperties(this.value)" placeholder="Type a tenement number or owner name to search...">
                <div id="results"></div>
            </div>
        </div>

        <p class="muted">Search matches the tenement number (e.g. VLD-0142) or the owner's name. Results appear below as you type, without reloading the page.</p>
    </div>
</div>

<script>
// AJAX search - matches syllabus XMLHttpRequest pattern exactly
function searchProperties(str) {
    if (str == "") { document.getElementById("results").innerHTML = ""; return; }
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            document.getElementById("results").innerHTML = this.responseText;
        }
    };
    xmlhttp.open("GET", "search_properties.php?q=" + str, true);
    xmlhttp.send();
}
</script>
</body>
</html>
