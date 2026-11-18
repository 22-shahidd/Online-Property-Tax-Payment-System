<?php
session_start();
if (!isset($_SESSION['uid'])) { header("Location: ../index.php"); exit; }
if ($_SESSION['urole'] !== 'admin') { header("Location: ../index.php"); exit; }
include '../db.php';

// Filters
$mode  = isset($_GET['mode'])  ? mysqli_real_escape_string($con, $_GET['mode'])  : "";
$order = isset($_GET['order']) ? mysqli_real_escape_string($con, $_GET['order']) : "pm.payid DESC";
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;

// allowlist order column to avoid order-by injection
$allowed = ['pm.payid DESC','pm.payid ASC','pm.paiddate DESC','pm.paiddate ASC','pm.amount DESC','pm.amount ASC'];
if (!in_array($order, $allowed)) $order = 'pm.payid DESC';
if ($limit <= 0 || $limit > 500) $limit = 50;

$where = "";
if ($mode == 'online' || $mode == 'offline') $where = "WHERE pm.mode='$mode'";

$sql = "SELECT pm.payid, pm.amount, pm.mode, pm.recno, pm.paiddate,
               p.tno, p.address, p.ptype,
               u.uname AS owner,
               c.uname AS collector
        FROM paymentmaster pm
        JOIN taxmaster t ON pm.tid=t.tid
        JOIN propertymaster p ON t.pid=p.pid
        JOIN usermaster u ON p.uid=u.uid
        LEFT JOIN usermaster c ON pm.collected_by=c.uid
        $where
        ORDER BY $order
        LIMIT $limit";
$res = mysqli_query($con, $sql);

$tw = ($mode == 'online' || $mode == 'offline') ? "WHERE mode='$mode'" : "";
$total = mysqli_query($con, "SELECT IFNULL(SUM(amount),0) AS s FROM paymentmaster $tw");
$totalAmt = mysqli_fetch_array($total)['s'];
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Reports - Nagarpalika</title>
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
        <a href="reports.php" class="active">Reports</a>
        <a href="manage_users.php">Manage Users</a>
        <a href="add_officer.php">Add Officer</a>
    </div>
    <div class="main">
        <h1 class="page-title">Payment Reports</h1>

        <div class="panel">
            <div class="panel-header">Filter</div>
            <div class="panel-body">
                <form method="get" style="display:flex; gap:12px; flex-wrap:wrap; align-items:flex-end;">
                    <div class="form-group" style="min-width:140px;">
                        <label>Mode</label>
                        <select name="mode">
                            <option value="">All</option>
                            <option value="online"  <?php if($mode=='online')  echo 'selected'; ?>>Online</option>
                            <option value="offline" <?php if($mode=='offline') echo 'selected'; ?>>Offline</option>
                        </select>
                    </div>
                    <div class="form-group" style="min-width:160px;">
                        <label>Sort By</label>
                        <select name="order">
                            <option value="pm.payid DESC"  <?php if($order=='pm.payid DESC')  echo 'selected'; ?>>Newest First</option>
                            <option value="pm.payid ASC"   <?php if($order=='pm.payid ASC')   echo 'selected'; ?>>Oldest First</option>
                            <option value="pm.paiddate DESC" <?php if($order=='pm.paiddate DESC') echo 'selected'; ?>>Date (new)</option>
                            <option value="pm.paiddate ASC"  <?php if($order=='pm.paiddate ASC')  echo 'selected'; ?>>Date (old)</option>
                            <option value="pm.amount DESC" <?php if($order=='pm.amount DESC') echo 'selected'; ?>>Amount (high)</option>
                            <option value="pm.amount ASC"  <?php if($order=='pm.amount ASC')  echo 'selected'; ?>>Amount (low)</option>
                        </select>
                    </div>
                    <div class="form-group" style="min-width:100px;">
                        <label>Rows</label>
                        <select name="limit">
                            <?php foreach ([20,50,100,200] as $n) {
                                echo "<option value='$n' " . ($limit==$n?'selected':'') . ">$n</option>";
                            } ?>
                        </select>
                    </div>
                    <button type="submit" class="btn btn-primary">Apply</button>
                    <a href="reports.php" class="btn btn-warning">Reset</a>
                </form>
            </div>
        </div>

        <div class="stats-grid">
            <div class="stat-card success">
                <div class="label">Total Shown (<?php echo mysqli_num_rows($res); ?>)</div>
                <div class="value">&#8377;<?php
                    $sumShown = 0;
                    while ($rr = mysqli_fetch_array($res)) $sumShown += $rr['amount'];
                    echo number_format($sumShown,2);
                    mysqli_data_seek($res, 0);
                ?></div>
            </div>
            <div class="stat-card">
                <div class="label">Grand Total (filtered)</div>
                <div class="value">&#8377;<?php echo number_format($totalAmt,2); ?></div>
            </div>
        </div>

        <div class="panel">
            <div class="panel-header">Payments</div>
            <div class="panel-body">
                <?php if (mysqli_num_rows($res) == 0) {
                    echo "<div class='empty'>No payments match the filter.</div>";
                } else { ?>
                    <table>
                        <thead><tr>
                            <th>Receipt No</th><th>Property</th><th>Owner</th>
                            <th>Type</th><th>Amount</th><th>Mode</th>
                            <th>Collected By</th><th>Paid On</th>
                        </tr></thead>
                        <tbody>
                        <?php while ($row = mysqli_fetch_array($res)) { ?>
                            <tr>
                                <td><?php echo $row['recno']; ?></td>
                                <td><?php echo $row['tno']; ?><br><span class="muted"><?php echo $row['address']; ?></span></td>
                                <td><?php echo $row['owner']; ?></td>
                                <td><?php echo $row['ptype']; ?></td>
                                <td>&#8377;<?php echo number_format($row['amount'],2); ?></td>
                                <td><?php echo ucfirst($row['mode']); ?></td>
                                <td><?php echo $row['collector'] ? $row['collector'] : "-"; ?></td>
                                <td><?php echo $row['paiddate']; ?></td>
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
