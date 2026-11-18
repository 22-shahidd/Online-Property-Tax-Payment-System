<?php
session_start();
if (!isset($_SESSION['uid'])) { header("Location: ../index.php"); exit; }
if ($_SESSION['urole'] !== 'officer') { header("Location: ../index.php"); exit; }
include '../db.php';
$oid = $_SESSION['uid'];

$ok  = "";
$err = "";

// Resolve / in-progress a grievance
if (isset($_POST['resolve'])) {
    $gid        = (int)$_POST['gid'];
    $status     = mysqli_real_escape_string($con, $_POST['status']);
    $resolution = mysqli_real_escape_string($con, $_POST['resolution']);
    $sql = "UPDATE grievancemaster SET status='$status', resolution='$resolution'
            WHERE gid=$gid AND officer_id=$oid";
    if (mysqli_query($con, $sql)) $ok = "Grievance #$gid updated.";
    else $err = "Update failed.";
}

// grievances assigned to this officer
$griev = mysqli_query($con, "SELECT g.*, p.tno, u.uname AS citizen
                             FROM grievancemaster g
                             JOIN propertymaster p ON g.pid=p.pid
                             JOIN usermaster u ON g.uid=u.uid
                             WHERE g.officer_id=$oid
                             ORDER BY
                               CASE g.status WHEN 'open' THEN 0 WHEN 'in_progress' THEN 1 ELSE 2 END,
                               g.gid ASC");
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
        Officer: <?php echo $_SESSION['uname']; ?>
        <a href="../logout.php">Logout</a>
    </div>
</div>
<div class="layout">
    <div class="sidebar">
        <div class="side-label">Officer</div>
        <a href="dashboard.php">Dashboard</a>
        <a href="verify_properties.php">Verify Properties</a>
        <a href="search_properties.php">Search Properties</a>
        <a href="offline_payment.php">Offline Payment</a>
        <a href="grievances.php" class="active">Grievances</a>
    </div>
    <div class="main">
        <h1 class="page-title">Grievances</h1>

        <?php if ($ok  != "") echo "<div class='msg msg-ok'>$ok</div>"; ?>
        <?php if ($err != "") echo "<div class='msg msg-err'>$err</div>"; ?>

        <div class="panel">
            <div class="panel-header">Assigned Grievances</div>
            <div class="panel-body">
                <?php if (mysqli_num_rows($griev) == 0) {
                    echo "<div class='empty'>No grievances assigned to you.</div>";
                } else { ?>
                    <table>
                        <thead><tr>
                            <th>ID</th><th>Citizen</th><th>Property</th><th>Subject</th>
                            <th>Description</th><th>Status</th><th>Resolution</th><th>Action</th>
                        </tr></thead>
                        <tbody>
                        <?php while ($g = mysqli_fetch_array($griev)) {
                            $badge = "badge-" . $g['status']; ?>
                            <tr>
                                <td><?php echo $g['gid']; ?></td>
                                <td><?php echo $g['citizen']; ?></td>
                                <td><?php echo $g['tno']; ?></td>
                                <td><?php echo $g['subject']; ?></td>
                                <td><?php echo $g['description']; ?></td>
                                <td><span class="badge <?php echo $badge; ?>"><?php echo $g['status']; ?></span></td>
                                <td><?php echo $g['resolution'] ? $g['resolution'] : "-"; ?></td>
                                <td>
                                    <?php if ($g['status'] != 'resolved') { ?>
                                    <form method="post" style="display:flex; gap:6px; flex-wrap:wrap;">
                                        <input type="hidden" name="gid" value="<?php echo $g['gid']; ?>">
                                        <input type="text" name="resolution" placeholder="Resolution note" required style="padding:5px 8px; border:1px solid #ced4da; border-radius:4px; width:160px;">
                                        <select name="status" style="padding:5px 8px; border:1px solid #ced4da; border-radius:4px;">
                                            <option value="in_progress">In Progress</option>
                                            <option value="resolved">Resolved</option>
                                        </select>
                                        <button type="submit" name="resolve" class="btn btn-success btn-sm">Update</button>
                                    </form>
                                    <?php } else echo "<span class='muted'>Done</span>"; ?>
                                </td>
                            </tr>
                        <?php } ?>
                        </tbody>
                    </table>
                <?php } ?>
            </div>
        </div>

    </div>
</div>
</body>
</html>
