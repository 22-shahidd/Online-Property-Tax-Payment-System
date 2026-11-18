<?php
session_start();
if (!isset($_SESSION['uid'])) { header("Location: ../index.php"); exit; }
if ($_SESSION['urole'] !== 'citizen') { header("Location: ../index.php"); exit; }
include '../db.php';
$uid = $_SESSION['uid'];
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Citizen Dashboard - Nagarpalika</title>
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
        <a href="dashboard.php" class="active">Dashboard</a>
        <a href="add_property.php">Add Property</a>
        <a href="pay_tax.php">Pay Tax</a>
        <a href="grievance.php">Grievances</a>
    </div>
    <div class="main">
        <h1 class="page-title">My Dashboard</h1>

        <div class="stats-grid">
            <?php
            $r = mysqli_query($con, "SELECT COUNT(*) AS c FROM propertymaster WHERE uid=$uid");
            $totalProps = mysqli_fetch_array($r)['c'];

            $r = mysqli_query($con, "SELECT COUNT(*) AS c FROM propertymaster WHERE uid=$uid AND status='verified'");
            $verified = mysqli_fetch_array($r)['c'];

            $r = mysqli_query($con, "SELECT IFNULL(SUM(t.totaldue),0) AS s FROM taxmaster t
                                     JOIN propertymaster p ON t.pid=p.pid
                                     WHERE p.uid=$uid AND t.status='unpaid'");
            $totalDue = mysqli_fetch_array($r)['s'];

            $r = mysqli_query($con, "SELECT COUNT(*) AS c FROM grievancemaster WHERE uid=$uid AND status<>'resolved'");
            $openG = mysqli_fetch_array($r)['c'];
            ?>
            <div class="stat-card"><div class="label">My Properties</div><div class="value"><?php echo $totalProps; ?></div></div>
            <div class="stat-card success"><div class="label">Verified</div><div class="value"><?php echo $verified; ?></div></div>
            <div class="stat-card error"><div class="label">Total Due</div><div class="value">&#8377;<?php echo number_format($totalDue,2); ?></div></div>
            <div class="stat-card warning"><div class="label">Open Grievances</div><div class="value"><?php echo $openG; ?></div></div>
        </div>

        <div class="panel">
            <div class="panel-header">My Properties &amp; Tax Status</div>
            <div class="panel-body">
                <?php
                $sql = "SELECT p.*, w.wardno, w.zone,
                               (SELECT t.totaldue FROM taxmaster t WHERE t.pid=p.pid AND t.status='unpaid' ORDER BY t.tid DESC LIMIT 1) AS due
                        FROM propertymaster p
                        JOIN wardmaster w ON p.wid=w.wid
                        WHERE p.uid=$uid
                        ORDER BY p.pid DESC";
                $result = mysqli_query($con, $sql);
                if (mysqli_num_rows($result) == 0) {
                    echo "<div class='empty'>You have not registered any property yet. <a href='add_property.php'>Add one now</a>.</div>";
                } else {
                    echo "<table><thead><tr>
                        <th>Tenement No</th><th>Address</th><th>Ward</th><th>Type</th>
                        <th>Area (sqft)</th><th>Built Year</th><th>Status</th><th>Tax Due</th>
                    </tr></thead><tbody>";
                    while ($row = mysqli_fetch_array($result)) {
                        $badge = "badge-" . $row['status'];
                        $due = $row['due'] !== null ? "&#8377;" . number_format($row['due'],2) : "-";
                        echo "<tr>
                            <td>{$row['tno']}</td><td>{$row['address']}</td>
                            <td>{$row['wardno']} ({$row['zone']})</td><td>{$row['ptype']}</td>
                            <td>{$row['areasq']}</td><td>{$row['cyear']}</td>
                            <td><span class='badge $badge'>{$row['status']}</span></td>
                            <td>$due</td>
                        </tr>";
                    }
                    echo "</tbody></table>";
                }
                ?>
            </div>
        </div>
    </div>
</div>
</body>
</html>
