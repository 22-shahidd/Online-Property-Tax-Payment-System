<?php
session_start();
if (!isset($_SESSION['uid'])) { header("Location: ../index.php"); exit; }
if ($_SESSION['urole'] !== 'officer') { header("Location: ../index.php"); exit; }
include '../db.php';
$oid = $_SESSION['uid'];

$err = "";
$ok  = "";

// Record the offline payment
if (isset($_POST['record_payment'])) {
    $tid    = (int)$_POST['tid'];
    $amount = mysqli_real_escape_string($con, $_POST['amount']);
    $recno  = mysqli_real_escape_string($con, $_POST['recno']);
    $payer  = mysqli_real_escape_string($con, $_POST['payer_name']);

    // verify the tax record exists and is unpaid
    $chk = mysqli_query($con, "SELECT t.*, p.tno, p.address, u.uname AS owner
                               FROM taxmaster t
                               JOIN propertymaster p ON t.pid=p.pid
                               JOIN usermaster u ON p.uid=u.uid
                               WHERE t.tid=$tid AND t.status='unpaid'");
    if (mysqli_num_rows($chk) == 1) {
        $info = mysqli_fetch_array($chk);
        $ins = "INSERT INTO paymentmaster (tid, amount, mode, recno, collected_by)
                VALUES ($tid, '$amount', 'offline', '$recno', $oid)";
        if (mysqli_query($con, $ins)) {
            mysqli_query($con, "UPDATE taxmaster SET totaldue='$amount', status='paid' WHERE tid=$tid");
            $ok = "Offline payment recorded successfully. Receipt No: $recno | Property: {$info['tno']} | Amount: &#8377;" . number_format($amount, 2);
        } else {
            $err = "Failed to record payment: " . mysqli_error($con);
        }
    } else {
        $err = "Invalid or already-paid tax record.";
    }
}

// Lazily generate tax rows for verified properties that don't have one yet
// for the current assessment year (same logic as citizen/pay_tax.php), so the
// officer can record a counter payment as soon as a property is verified.
$ay = date('Y');
$verified = mysqli_query($con, "SELECT * FROM propertymaster WHERE status='verified'");
while ($p = mysqli_fetch_array($verified)) {
    $pid = $p['pid'];
    $tq = mysqli_query($con, "SELECT tid FROM taxmaster WHERE pid=$pid AND assessyear=$ay LIMIT 1");
    if (mysqli_num_rows($tq) == 0) {
        $base = computeBaseTax($p['areasq'], $p['ptype'], $p['cyear']);
        $due  = date('Y-m-d', strtotime('+90 days'));
        $baseEsc = mysqli_real_escape_string($con, $base);
        $dueEsc  = mysqli_real_escape_string($con, $due);
        mysqli_query($con, "INSERT INTO taxmaster (pid, assessyear, basetax, rebate, penalty, totaldue, status, duedate)
                            VALUES ($pid, $ay, '$baseEsc', 0, 0, '$baseEsc', 'unpaid', '$dueEsc')");
    }
}

// Get all verified properties with unpaid tax (for the dropdown)
$dues = mysqli_query($con, "SELECT t.tid, t.totaldue, t.basetax, t.duedate, t.assessyear,
                                   p.pid, p.tno, p.address, p.ptype, p.areasq, p.cyear,
                                   u.uname AS owner, u.phone, u.email
                            FROM taxmaster t
                            JOIN propertymaster p ON t.pid=p.pid
                            JOIN usermaster u ON p.uid=u.uid
                            WHERE t.status='unpaid' AND p.status='verified'
                            ORDER BY t.duedate ASC");

// recent offline payments by this officer
$recent = mysqli_query($con, "SELECT pm.payid, pm.amount, pm.recno, pm.paiddate,
                                     p.tno, u.uname AS owner
                              FROM paymentmaster pm
                              JOIN taxmaster t ON pm.tid=t.tid
                              JOIN propertymaster p ON t.pid=p.pid
                              JOIN usermaster u ON p.uid=u.uid
                              WHERE pm.collected_by=$oid AND pm.mode='offline'
                              ORDER BY pm.payid DESC LIMIT 10");
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Offline Payment - Nagarpalika</title>
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
        <a href="offline_payment.php" class="active">Offline Payment</a>
        <a href="grievances.php">Grievances</a>
    </div>
    <div class="main">
        <h1 class="page-title">Record Counter (Offline) Payment</h1>

        <?php if ($ok  != "") echo "<div class='msg msg-ok'>$ok</div>"; ?>
        <?php if ($err != "") echo "<div class='msg msg-err'>$err</div>"; ?>

        <div class="panel">
            <div class="panel-header">Select Property &amp; Enter Payment</div>
            <div class="panel-body">
                <?php if (mysqli_num_rows($dues) == 0) { ?>
                    <div class="empty">No verified properties with unpaid tax right now.</div>
                <?php } else { ?>
                    <form method="post" id="payForm">
                        <div class="form-grid">
                            <div class="form-group full">
                                <label>Select Property (with unpaid tax)</label>
                                <select name="tid" id="tid" required onchange="showDetails()">
                                    <option value="">-- Select Property --</option>
                                    <?php
                                    $jsData = array();
                                    while ($d = mysqli_fetch_array($dues)) {
                                        $dispDue = computeFinalDue($d['basetax'], $d['duedate']);
                                        echo "<option value='{$d['tid']}' data-owner='" . htmlspecialchars($d['owner']) . "' data-phone='" . htmlspecialchars($d['phone']) . "' data-email='" . htmlspecialchars($d['email']) . "' data-tno='" . htmlspecialchars($d['tno']) . "' data-address='" . htmlspecialchars($d['address']) . "' data-ptype='" . htmlspecialchars($d['ptype']) . "' data-areasq='" . htmlspecialchars($d['areasq']) . "' data-basetax='" . htmlspecialchars(number_format($d['basetax'],2)) . "' data-duedate='" . htmlspecialchars($d['duedate']) . "' data-due='" . htmlspecialchars(number_format($dispDue,2)) . "'>{$d['tno']} - {$d['owner']} ({$d['address']})</option>";
                                    }
                                    ?>
                                </select>
                            </div>
                        </div>

                        <div id="details" style="display:none; margin-top:18px;">
                            <table style="margin-bottom:18px;">
                                <tr><th>Owner Name</th><td id="d_owner"></td></tr>
                                <tr><th>Phone</th><td id="d_phone"></td></tr>
                                <tr><th>Email</th><td id="d_email"></td></tr>
                                <tr><th>Tenement No</th><td id="d_tno"></td></tr>
                                <tr><th>Address</th><td id="d_address"></td></tr>
                                <tr><th>Property Type</th><td id="d_ptype"></td></tr>
                                <tr><th>Area</th><td id="d_areasq"></td></tr>
                                <tr><th>Base Tax</th><td id="d_basetax"></td></tr>
                                <tr><th>Due Date</th><td id="d_duedate"></td></tr>
                                <tr><th>Current Amount Due</th><td id="d_due" class="due-amount"></td></tr>
                            </table>

                            <div class="form-grid">
                                <div class="form-group">
                                    <label>Payer Name (citizen who came to the counter)</label>
                                    <input type="text" name="payer_name" id="payer_name" required placeholder="Name of the person paying">
                                </div>
                                <div class="form-group">
                                    <label>Receipt Number</label>
                                    <input type="text" name="recno" required placeholder="OFF-001">
                                </div>
                                <div class="form-group full">
                                    <label>Amount Received (&#8377;)</label>
                                    <input type="number" step="0.01" name="amount" id="amount" required>
                                </div>
                            </div>
                            <div class="form-actions">
                                <button type="submit" name="record_payment" class="btn btn-success">Record Payment</button>
                            </div>
                        </div>
                    </form>
                <?php } ?>
            </div>
        </div>

        <div class="panel">
            <div class="panel-header">My Recent Offline Payments</div>
            <div class="panel-body">
                <?php if (mysqli_num_rows($recent) == 0) {
                    echo "<div class='empty'>No offline payments recorded yet.</div>";
                } else { ?>
                    <table>
                        <thead><tr><th>Receipt No</th><th>Property</th><th>Owner</th><th>Amount</th><th>Date</th></tr></thead>
                        <tbody>
                        <?php while ($r = mysqli_fetch_array($recent)) { ?>
                            <tr>
                                <td><?php echo $r['recno']; ?></td>
                                <td><?php echo $r['tno']; ?></td>
                                <td><?php echo $r['owner']; ?></td>
                                <td>&#8377;<?php echo number_format($r['amount'],2); ?></td>
                                <td><?php echo $r['paiddate']; ?></td>
                            </tr>
                        <?php } ?>
                        </tbody>
                    </table>
                <?php } ?>
            </div>
        </div>
    </div>
</div>

<script>
function showDetails() {
    var sel = document.getElementById('tid');
    var opt = sel.options[sel.selectedIndex];
    var div = document.getElementById('details');
    if (!opt || !opt.value) { div.style.display = 'none'; return; }
    div.style.display = 'block';
    document.getElementById('d_owner').textContent    = opt.dataset.owner    || '';
    document.getElementById('d_phone').textContent    = opt.dataset.phone    || '';
    document.getElementById('d_email').textContent    = opt.dataset.email    || '';
    document.getElementById('d_tno').textContent      = opt.dataset.tno      || '';
    document.getElementById('d_address').textContent  = opt.dataset.address  || '';
    document.getElementById('d_ptype').textContent    = opt.dataset.ptype    || '';
    document.getElementById('d_areasq').textContent   = opt.dataset.areasq   || '';
    document.getElementById('d_basetax').textContent  = '\u20B9' + (opt.dataset.basetax || '');
    document.getElementById('d_duedate').textContent  = opt.dataset.duedate  || '';
    document.getElementById('d_due').textContent      = '\u20B9' + (opt.dataset.due || '');
    // pre-fill payer name with owner and amount with due
    document.getElementById('payer_name').value = opt.dataset.owner || '';
    document.getElementById('amount').value = opt.dataset.due ? opt.dataset.due.replace(/,/g,'') : '';
}
</script>
</body>
</html>
