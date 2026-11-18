<?php
session_start();
if (!isset($_SESSION['uid'])) { header("Location: ../index.php"); exit; }
if ($_SESSION['urole'] !== 'admin') { header("Location: ../index.php"); exit; }
include '../db.php';
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Admin Dashboard - Nagarpalika</title>
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
        <a href="dashboard.php" class="active">Dashboard</a>
        <a href="manage_rates.php">Manage Rates</a>
        <a href="reports.php">Reports</a>
        <a href="manage_users.php">Manage Users</a>
        <a href="add_officer.php">Add Officer</a>
    </div>
    <div class="main">
        <h1 class="page-title">Admin Dashboard</h1>

        <div class="stats-grid">
            <?php
            $r = mysqli_query($con, "SELECT COUNT(*) AS c FROM usermaster WHERE urole='citizen'"); $cit = mysqli_fetch_array($r)['c'];
            $r = mysqli_query($con, "SELECT COUNT(*) AS c FROM propertymaster"); $props = mysqli_fetch_array($r)['c'];
            $r = mysqli_query($con, "SELECT COUNT(*) AS c FROM propertymaster WHERE status='verified'"); $ver = mysqli_fetch_array($r)['c'];
            $r = mysqli_query($con, "SELECT COUNT(*) AS c FROM propertymaster WHERE status='pending'"); $pen = mysqli_fetch_array($r)['c'];
            $r = mysqli_query($con, "SELECT IFNULL(SUM(amount),0) AS s FROM paymentmaster"); $collected = mysqli_fetch_array($r)['s'];
            $r = mysqli_query($con, "SELECT IFNULL(SUM(totaldue),0) AS s FROM taxmaster WHERE status='unpaid'"); $outstanding = mysqli_fetch_array($r)['s'];
            $r = mysqli_query($con, "SELECT COUNT(*) AS c FROM grievancemaster WHERE status<>'resolved'"); $openG = mysqli_fetch_array($r)['c'];
            $r = mysqli_query($con, "SELECT COUNT(*) AS c FROM paymentmaster"); $payCount = mysqli_fetch_array($r)['c'];
            ?>
            <div class="stat-card"><div class="label">Citizens</div><div class="value"><?php echo $cit; ?></div></div>
            <div class="stat-card"><div class="label">Properties</div><div class="value"><?php echo $props; ?></div></div>
            <div class="stat-card success"><div class="label">Verified</div><div class="value"><?php echo $ver; ?></div></div>
            <div class="stat-card warning"><div class="label">Pending</div><div class="value"><?php echo $pen; ?></div></div>
            <div class="stat-card success"><div class="label">Total Collected</div><div class="value">&#8377;<?php echo number_format($collected,2); ?></div></div>
            <div class="stat-card error"><div class="label">Outstanding</div><div class="value">&#8377;<?php echo number_format($outstanding,2); ?></div></div>
            <div class="stat-card warning"><div class="label">Open Grievances</div><div class="value"><?php echo $openG; ?></div></div>
            <div class="stat-card"><div class="label">Payments</div><div class="value"><?php echo $payCount; ?></div></div>
        </div>

        <div class="panel">
            <div class="panel-header">Recent Payments</div>
            <div class="panel-body">
                <?php
                $sql = "SELECT pm.payid, pm.amount, pm.mode, pm.recno, pm.paiddate,
                               p.tno, u.uname AS owner
                        FROM paymentmaster pm
                        JOIN taxmaster t ON pm.tid=t.tid
                        JOIN propertymaster p ON t.pid=p.pid
                        JOIN usermaster u ON p.uid=u.uid
                        ORDER BY pm.payid DESC LIMIT 10";
                $res = mysqli_query($con, $sql);
                if (mysqli_num_rows($res) == 0) {
                    echo "<div class='empty'>No payments recorded yet.</div>";
                } else {
                    echo "<table><thead><tr>
                        <th>Receipt</th><th>Property</th><th>Owner</th>
                        <th>Amount</th><th>Mode</th><th>Date</th>
                    </tr></thead><tbody>";
                    while ($row = mysqli_fetch_array($res)) {
                        echo "<tr>
                            <td>{$row['recno']}</td><td>{$row['tno']}</td>
                            <td>{$row['owner']}</td>
                            <td>&#8377;" . number_format($row['amount'],2) . "</td>
                            <td>{$row['mode']}</td><td>{$row['paiddate']}</td>
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
