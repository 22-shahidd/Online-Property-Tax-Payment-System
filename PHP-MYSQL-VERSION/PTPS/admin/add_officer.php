<?php
session_start();
if (!isset($_SESSION['uid'])) { header("Location: ../index.php"); exit; }
if ($_SESSION['urole'] !== 'admin') { header("Location: ../index.php"); exit; }
include '../db.php';

$err = "";
$ok  = "";

if (isset($_POST['add_officer'])) {
    $uname  = mysqli_real_escape_string($con, $_POST['uname']);
    $email  = mysqli_real_escape_string($con, $_POST['email']);
    $upwd   = mysqli_real_escape_string($con, $_POST['upwd']);
    $phone  = mysqli_real_escape_string($con, $_POST['phone']);
    $ward   = (int)$_POST['wid'];

    // duplicate email check
    $chk = mysqli_query($con, "SELECT uid FROM usermaster WHERE email='$email'");
    if (mysqli_num_rows($chk) > 0) {
        $err = "Email already exists. Use a different email.";
    } else {
        $sql = "INSERT INTO usermaster (uname, email, upwd, urole, phone, status)
                VALUES ('$uname', '$email', '$upwd', 'officer', '$phone', 'active')";
        if (mysqli_query($con, $sql)) {
            $newUid = mysqli_insert_id($con);
            // optionally assign a ward to this officer
            if ($ward > 0) {
                mysqli_query($con, "UPDATE wardmaster SET officer_id=$newUid WHERE wid=$ward");
            }
            $ok = "Officer '$uname' added successfully" . ($ward > 0 ? " and assigned to the selected ward." : ".");
        } else {
            $err = "Failed: " . mysqli_error($con);
        }
    }
}

$wards = mysqli_query($con, "SELECT * FROM wardmaster ORDER BY wardno");
$officers = mysqli_query($con, "SELECT u.*, w.wardno, w.zone
                                FROM usermaster u
                                LEFT JOIN wardmaster w ON w.officer_id=u.uid
                                WHERE u.urole='officer'
                                ORDER BY u.uid ASC");
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Add Officer - Nagarpalika</title>
    <link rel="stylesheet" href="../css/style.css">
</head>
<body>
<div class="topbar">
    <div class="brand">Nagarpalika <span>Property Tax</span></div>
    <div class="user-info">
        Admin: <?php echo $_SESSION['uname']; ?>
        <a href="../logout.php">Logout</a>
    </div>
</div>
<div class="layout">
    <div class="sidebar">
        <div class="side-label">Admin</div>
        <a href="dashboard.php">Dashboard</a>
        <a href="manage_rates.php">Manage Rates</a>
        <a href="reports.php">Reports</a>
        <a href="manage_users.php">Manage Users</a>
        <a href="add_officer.php" class="active">Add Officer</a>
    </div>
    <div class="main">
        <h1 class="page-title">Add New Officer</h1>

        <?php if ($err != "") echo "<div class='msg msg-err'>$err</div>"; ?>
        <?php if ($ok  != "") echo "<div class='msg msg-ok'>$ok</div>"; ?>

        <div class="panel">
            <div class="panel-header">Officer Details</div>
            <div class="panel-body">
                <form method="post">
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Full Name</label>
                            <input type="text" name="uname" required placeholder="Officer name">
                        </div>
                        <div class="form-group">
                            <label>Email</label>
                            <input type="email" name="email" required placeholder="officer@nagarpalika.in">
                        </div>
                        <div class="form-group">
                            <label>Phone (10 digits)</label>
                            <input type="text" name="phone" required pattern="[0-9]{10}" placeholder="9876543210">
                        </div>
                        <div class="form-group">
                            <label>Password</label>
                            <input type="text" name="upwd" required placeholder="Temporary password">
                        </div>
                        <div class="form-group full">
                            <label>Assign Ward (optional)</label>
                            <select name="wid">
                                <option value="0">-- None --</option>
                                <?php while ($w = mysqli_fetch_array($wards)) {
                                    $taken = $w['officer_id'] ? " (currently assigned)" : "";
                                    echo "<option value='{$w['wid']}'>{$w['wardno']} - {$w['zone']}{$taken}</option>";
                                } ?>
                            </select>
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="submit" name="add_officer" class="btn btn-primary">Add Officer</button>
                    </div>
                </form>
            </div>
        </div>

        <div class="panel">
            <div class="panel-header">Existing Officers</div>
            <div class="panel-body">
                <table>
                    <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Assigned Ward</th><th>Status</th></tr></thead>
                    <tbody>
                    <?php while ($o = mysqli_fetch_array($officers)) {
                        $badge = "badge-" . $o['status'];
                        $wardInfo = $o['wardno'] ? "{$o['wardno']} ({$o['zone']})" : "<span class='muted'>Unassigned</span>";
                        echo "<tr>
                            <td>{$o['uid']}</td><td>{$o['uname']}</td><td>{$o['email']}</td>
                            <td>{$o['phone']}</td><td>$wardInfo</td>
                            <td><span class='badge $badge'>{$o['status']}</span></td>
                        </tr>";
                    } ?>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>
</body>
</html>
