<?php
session_start();
if (!isset($_SESSION['uid'])) { header("Location: ../index.php"); exit; }
if ($_SESSION['urole'] !== 'officer') { header("Location: ../index.php"); exit; }
include '../db.php';
$oid = $_SESSION['uid'];

$ok  = "";

// Approve / Reject
if (isset($_GET['action']) && isset($_GET['pid'])) {
    $pid   = (int)$_GET['pid'];
    $act   = mysqli_real_escape_string($con, $_GET['action']);
    $remark = "";
    if (isset($_GET['remark'])) $remark = mysqli_real_escape_string($con, $_GET['remark']);

    if ($act == 'approve') {
        $newStatus = 'verified';
    } elseif ($act == 'reject') {
        $newStatus = 'rejected';
    } else {
        $newStatus = '';
    }

    if ($newStatus != "") {
        $sql = "UPDATE propertymaster
                SET status='$newStatus', verified_by=$oid, remark='$remark'
                WHERE pid=$pid AND status='pending'";
        if (mysqli_query($con, $sql)) {
            $ok = "Property #$pid marked as $newStatus.";
        }
    }
}

// Pending list (all, but highlight the officer's wards)
$pend = mysqli_query($con, "SELECT p.*, u.uname AS owner, u.email, u.phone,
                                   w.wardno, w.zone
                            FROM propertymaster p
                            JOIN usermaster u ON p.uid=u.uid
                            JOIN wardmaster w ON p.wid=w.wid
                            WHERE p.status='pending'
                            ORDER BY p.pid ASC");
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Verify Properties - Nagarpalika</title>
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
        <a href="verify_properties.php" class="active">Verify Properties</a>
        <a href="search_properties.php">Search Properties</a>
        <a href="offline_payment.php">Offline Payment</a>
        <a href="grievances.php">Grievances</a>
    </div>
    <div class="main">
        <h1 class="page-title">Verify Pending Properties</h1>

        <?php if ($ok != "") echo "<div class='msg msg-ok'>$ok</div>"; ?>

        <!-- AJAX real-time search box (syllabus pattern) -->
        <div class="panel">
            <div class="panel-header">Quick Search (AJAX)</div>
            <div class="search-box">
                <input type="text" oninput="searchProperties(this.value)" placeholder="Type a tenement number or owner name to search...">
                <div id="results"></div>
            </div>
        </div>

        <div class="panel">
            <div class="panel-header">Pending Verification</div>
            <div class="panel-body">
                <?php if (mysqli_num_rows($pend) == 0) {
                    echo "<div class='empty'>No pending properties. All caught up!</div>";
                } else { ?>
                    <table>
                        <thead><tr>
                            <th>ID</th><th>Tenement No</th><th>Owner</th><th>Contact</th>
                            <th>Ward</th><th>Address</th><th>Type</th><th>Area</th><th>Built</th><th>Action</th>
                        </tr></thead>
                        <tbody>
                        <?php while ($p = mysqli_fetch_array($pend)) {
                            $myWard = ($p['officer_id'] ?? null) == $oid;
                            echo "<tr>
                                <td>{$p['pid']}</td><td>{$p['tno']}</td>
                                <td>{$p['owner']}</td>
                                <td>{$p['phone']}<br><span class='muted'>{$p['email']}</span></td>
                                <td>{$p['wardno']} ({$p['zone']})</td>
                                <td>{$p['address']}</td><td>{$p['ptype']}</td>
                                <td>{$p['areasq']} sqft</td><td>{$p['cyear']}</td>
                                <td>
                                    <a href='verify_properties.php?action=approve&pid={$p['pid']}&remark=verified' class='btn btn-success btn-sm' onclick=\"return confirm('Approve this property?')\">Approve</a>
                                    <a href='verify_properties.php?action=reject&pid={$p['pid']}&remark=rejected' class='btn btn-danger btn-sm' onclick=\"return confirm('Reject this property?')\">Reject</a>
                                </td>
                            </tr>";
                        } ?>
                        </tbody>
                    </table>
                <?php } ?>
            </div>
        </div>
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
