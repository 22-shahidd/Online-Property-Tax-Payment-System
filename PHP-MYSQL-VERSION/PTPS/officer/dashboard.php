<?php
session_start();
if (!isset($_SESSION['uid'])) { header("Location: ../index.php"); exit; }
if ($_SESSION['urole'] !== 'officer') { header("Location: ../index.php"); exit; }
include '../db.php';
$oid = $_SESSION['uid'];
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Officer Dashboard - Nagarpalika</title>
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
        <a href="dashboard.php" class="active">Dashboard</a>
        <a href="verify_properties.php">Verify Properties</a>
        <a href="search_properties.php">Search Properties</a>
        <a href="offline_payment.php">Offline Payment</a>
        <a href="grievances.php">Grievances</a>
    </div>
    <div class="main">
        <h1 class="page-title">Officer Dashboard</h1>

        <div class="stats-grid">
            <?php
            $r = mysqli_query($con, "SELECT COUNT(*) AS c FROM propertymaster WHERE status='pending'");
            $pending = mysqli_fetch_array($r)['c'];

            // wards this officer manages
            $r = mysqli_query($con, "SELECT GROUP_CONCAT(wid) AS wids FROM wardmaster WHERE officer_id=$oid");
            $wids = mysqli_fetch_array($r)['wids'];
            $myPending = 0;
            if ($wids) {
                $r = mysqli_query($con, "SELECT COUNT(*) AS c FROM propertymaster WHERE status='pending' AND wid IN ($wids)");
                $myPending = mysqli_fetch_array($r)['c'];
            }

            $r = mysqli_query($con, "SELECT COUNT(*) AS c FROM grievancemaster WHERE officer_id=$oid AND status<>'resolved'");
            $myG = mysqli_fetch_array($r)['c'];

            $r = mysqli_query($con, "SELECT COUNT(*) AS c FROM paymentmaster WHERE mode='offline' AND collected_by=$oid");
            $counter = mysqli_fetch_array($r)['c'];
            ?>
            <div class="stat-card warning"><div class="label">All Pending Properties</div><div class="value"><?php echo $pending; ?></div></div>
            <div class="stat-card"><div class="label">In My Wards</div><div class="value"><?php echo $myPending; ?></div></div>
            <div class="stat-card error"><div class="label">My Open Grievances</div><div class="value"><?php echo $myG; ?></div></div>
            <div class="stat-card success"><div class="label">Counter Payments</div><div class="value"><?php echo $counter; ?></div></div>
        </div>

        <div class="panel">
            <div class="panel-header">Quick Actions</div>
            <div class="panel-body">
                <a href="verify_properties.php" class="btn btn-primary">Review Pending Properties</a>
                <a href="search_properties.php" class="btn btn-primary">Search Properties (AJAX)</a>
                <a href="offline_payment.php" class="btn btn-primary">Record Offline Payment</a>
                <a href="grievances.php" class="btn btn-primary">Handle Grievances</a>
            </div>
        </div>
    </div>
</div>
</body>
</html>
