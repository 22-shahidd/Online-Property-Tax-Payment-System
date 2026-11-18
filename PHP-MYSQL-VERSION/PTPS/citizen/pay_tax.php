<?php
session_start();
if (!isset($_SESSION['uid'])) { header("Location: ../index.php"); exit; }
if ($_SESSION['urole'] !== 'citizen') { header("Location: ../index.php"); exit; }
include '../db.php';
$uid = $_SESSION['uid'];

$err = "";
$ok  = "";

// Handle payment submit
if (isset($_POST['pay'])) {
    $tid = (int)$_POST['tid'];
    // confirm this tax belongs to the citizen and is unpaid
    $chk = mysqli_query($con, "SELECT t.*, p.uid FROM taxmaster t
                               JOIN propertymaster p ON t.pid=p.pid
                               WHERE t.tid=$tid AND p.uid=$uid AND t.status='unpaid'");
    if (mysqli_num_rows($chk) == 1) {
        $trow = mysqli_fetch_array($chk);
        // recompute final due as of today (rebate/penalty)
        $today = date('Y-m-d');
        $final = computeFinalDue($trow['basetax'], $trow['duedate'], $today);
        $recno = "ONL" . date('Ymd') . sprintf('%04d', rand(0,9999));
        $finalEsc = mysqli_real_escape_string($con, $final);
        $recnoEsc = mysqli_real_escape_string($con, $recno);
        $ins = "INSERT INTO paymentmaster (tid, amount, mode, recno, collected_by)
                VALUES ($tid, '$finalEsc', 'online', '$recnoEsc', $uid)";
        if (mysqli_query($con, $ins)) {
            $upd = "UPDATE taxmaster SET totaldue='$finalEsc', status='paid' WHERE tid=$tid";
            mysqli_query($con, $upd);
            $ok = "Payment successful. Receipt No: $recno. Amount paid: &#8377;" . number_format($final,2);
        } else {
            $err = "Payment failed: " . mysqli_error($con);
        }
    } else {
        $err = "Invalid or already-paid tax record.";
    }
}

// List verified properties of this citizen with their unpaid tax (generate lazily)
$props = mysqli_query($con, "SELECT p.* FROM propertymaster p
                             WHERE p.uid=$uid AND p.status='verified'
                             ORDER BY p.pid DESC");
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Pay Tax - Nagarpalika</title>
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
        <a href="pay_tax.php" class="active">Pay Tax</a>
        <a href="grievance.php">Grievances</a>
    </div>
    <div class="main">
        <h1 class="page-title">Pay Property Tax</h1>

        <?php if ($err != "") echo "<div class='msg msg-err'>$err</div>"; ?>
        <?php if ($ok  != "") echo "<div class='msg msg-ok'>$ok</div>"; ?>

        <?php
        if (mysqli_num_rows($props) == 0) {
            echo "<div class='empty'>No verified properties yet. Once an officer verifies your property, tax will appear here.</div>";
        } else {
            while ($p = mysqli_fetch_array($props)) {
                $pid = $p['pid'];
                // ensure a tax row exists for current assessment year
                $ay = date('Y');
                $tq = mysqli_query($con, "SELECT * FROM taxmaster WHERE pid=$pid AND assessyear=$ay ORDER BY tid DESC LIMIT 1");
                if (mysqli_num_rows($tq) == 0) {
                    $base = computeBaseTax($p['areasq'], $p['ptype'], $p['cyear']);
                    $due  = date('Y-m-d', strtotime('+90 days'));
                    $baseEsc = mysqli_real_escape_string($con, $base);
                    $dueEsc  = mysqli_real_escape_string($con, $due);
                    mysqli_query($con, "INSERT INTO taxmaster (pid, assessyear, basetax, rebate, penalty, totaldue, status, duedate)
                                        VALUES ($pid, $ay, '$baseEsc', 0, 0, '$baseEsc', 'unpaid', '$dueEsc')");
                    $tq = mysqli_query($con, "SELECT * FROM taxmaster WHERE pid=$pid AND assessyear=$ay ORDER BY tid DESC LIMIT 1");
                }
                $t = mysqli_fetch_array($tq);
                // compute current final due on the fly for display
                $dispDue = computeFinalDue($t['basetax'], $t['duedate']);
                $badge = $t['status'] == 'paid' ? 'badge-paid' : 'badge-unpaid';
                $early = (date('Y-m-d') <= $t['duedate']);
                echo "<div class='panel'>
                    <div class='panel-header'>{$p['tno']} &mdash; {$p['address']} ({$p['ptype']}, {$p['areasq']} sqft)</div>
                    <div class='panel-body'>
                        <table>
                            <tr><th>Assessment Year</th><td>{$t['assessyear']}</td></tr>
                            <tr><th>Base Tax</th><td>&#8377;" . number_format($t['basetax'],2) . "</td></tr>
                            <tr><th>Due Date</th><td>{$t['duedate']}</td></tr>
                            <tr><th>Current Amount Due</th><td class='due-amount'>&#8377;" . number_format($dispDue,2) . "</td></tr>
                            <tr><th>Status</th><td><span class='badge $badge'>{$t['status']}</span></td></tr>";
                if ($early && $t['status'] == 'unpaid') {
                    echo "<tr><th>Note</th><td>Pay now to get a " . REBATE_PERCENT . "% rebate.</td></tr>";
                } elseif (!$early && $t['status'] == 'unpaid') {
                    echo "<tr><th>Note</th><td>Payment is late &mdash; a penalty of " . PENALTY_PERCENT . "% per month (max " . PENALTY_CAP . "%) is applied.</td></tr>";
                }
                echo "</table>";
                if ($t['status'] == 'unpaid') {
                    echo "<form method='post' class='mt-16'>
                            <input type='hidden' name='tid' value='{$t['tid']}'>
                            <button type='submit' name='pay' class='btn btn-success'>Pay &#8377;" . number_format($dispDue,2) . " Online</button>
                          </form>";
                } else {
                    // show last receipt
                    $pr = mysqli_query($con, "SELECT * FROM paymentmaster WHERE tid={$t['tid']} ORDER BY payid DESC LIMIT 1");
                    if ($pr && mysqli_num_rows($pr) > 0) {
                        $pay = mysqli_fetch_array($pr);
                        echo "<p class='mt-16 muted'>Paid on {$pay['paiddate']} | Receipt No: {$pay['recno']} | Mode: {$pay['mode']}</p>";
                    }
                }
                echo "</div></div>";
            }
        }
        ?>
    </div>
</div>
</body>
</html>
