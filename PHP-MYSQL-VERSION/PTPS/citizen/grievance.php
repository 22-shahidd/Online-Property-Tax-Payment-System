<?php
session_start();
if (!isset($_SESSION['uid'])) { header("Location: ../index.php"); exit; }
if ($_SESSION['urole'] !== 'citizen') { header("Location: ../index.php"); exit; }
include '../db.php';
$uid = $_SESSION['uid'];

$err = "";
$ok  = "";

if (isset($_POST['raise'])) {
    $pid  = (int)$_POST['pid'];
    $subj = mysqli_real_escape_string($con, $_POST['subject']);
    $desc = mysqli_real_escape_string($con, $_POST['description']);
    // confirm property belongs to this citizen
    $chk = mysqli_query($con, "SELECT pid FROM propertymaster WHERE pid=$pid AND uid=$uid");
    if (mysqli_num_rows($chk) == 1) {
        // assign to the officer of the property's ward (may be NULL)
        $w = mysqli_query($con, "SELECT w.officer_id FROM propertymaster p
                                 JOIN wardmaster w ON p.wid=w.wid WHERE p.pid=$pid");
        $wr = mysqli_fetch_array($w);
        $officer = (int)$wr['officer_id'];
        if ($officer == 0) $officer = "NULL";
        $sql = "INSERT INTO grievancemaster (uid, pid, subject, description, status, officer_id)
                VALUES ($uid, $pid, '$subj', '$desc', 'open', $officer)";
        if (mysqli_query($con, $sql)) {
            $ok = "Grievance submitted. An officer will review it.";
        } else {
            $err = "Failed: " . mysqli_error($con);
        }
    } else {
        $err = "Invalid property selected.";
    }
}

// my grievances
$myG = mysqli_query($con, "SELECT g.*, p.tno, u.uname AS officer
                           FROM grievancemaster g
                           JOIN propertymaster p ON g.pid=p.pid
                           LEFT JOIN usermaster u ON g.officer_id=u.uid
                           WHERE g.uid=$uid
                           ORDER BY g.gid DESC");
// my properties for the form dropdown
$myP = mysqli_query($con, "SELECT pid, tno, address FROM propertymaster WHERE uid=$uid ORDER BY pid DESC");
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Grievances - Nagarpalika</title>
    <link rel="stylesheet" href="../css/style.css">
</head>
<body>
<div class="topbar">
    <div class="brand">Nagarpalika <span>Property Tax</span></div>
    <div class="user-info">
        Welcome, <?php echo $_SESSION['uname']; ?>
        <a href="../logout.php">Logout</a>
    </div>
</div>
<div class="layout">
    <div class="sidebar">
        <div class="side-label">Citizen</div>
        <a href="dashboard.php">Dashboard</a>
        <a href="add_property.php">Add Property</a>
        <a href="pay_tax.php">Pay Tax</a>
        <a href="grievance.php" class="active">Grievances</a>
    </div>
    <div class="main">
        <h1 class="page-title">Grievances</h1>

        <?php if ($err != "") echo "<div class='msg msg-err'>$err</div>"; ?>
        <?php if ($ok  != "") echo "<div class='msg msg-ok'>$ok</div>"; ?>

        <div class="panel">
            <div class="panel-header">Raise a New Grievance</div>
            <div class="panel-body">
                <?php if (mysqli_num_rows($myP) == 0) { ?>
                    <div class="empty">You need a registered property before raising a grievance.</div>
                <?php } else { ?>
                <form method="post">
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Property</label>
                            <select name="pid" required>
                                <option value="">-- Select Property --</option>
                                <?php while ($p = mysqli_fetch_array($myP)) {
                                    echo "<option value='{$p['pid']}'>{$p['tno']} - {$p['address']}</option>";
                                } ?>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Subject</label>
                            <input type="text" name="subject" required placeholder="Short subject">
                        </div>
                        <div class="form-group full">
                            <label>Description</label>
                            <textarea name="description" required rows="3" placeholder="Describe your issue..."></textarea>
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="submit" name="raise" class="btn btn-primary">Submit Grievance</button>
                    </div>
                </form>
                <?php } ?>
            </div>
        </div>

        <div class="panel">
            <div class="panel-header">My Grievances</div>
            <div class="panel-body">
                <?php if (mysqli_num_rows($myG) == 0) {
                    echo "<div class='empty'>No grievances raised yet.</div>";
                } else { ?>
                    <table>
                        <thead><tr>
                            <th>ID</th><th>Property</th><th>Subject</th><th>Officer</th>
                            <th>Status</th><th>Resolution</th><th>Created</th>
                        </tr></thead>
                        <tbody>
                        <?php while ($g = mysqli_fetch_array($myG)) {
                            $badge = "badge-" . $g['status'];
                            echo "<tr>
                                <td>{$g['gid']}</td><td>{$g['tno']}</td>
                                <td>{$g['subject']}</td>
                                <td>" . ($g['officer'] ? $g['officer'] : "Unassigned") . "</td>
                                <td><span class='badge $badge'>{$g['status']}</span></td>
                                <td>" . ($g['resolution'] ? $g['resolution'] : "-") . "</td>
                                <td>{$g['createddate']}</td>
                            </tr>";
                        } ?>
                        </tbody>
                    </table>
                <?php } ?>
            </div>
        </div>
    </div>
</div>
</body>
</html>
