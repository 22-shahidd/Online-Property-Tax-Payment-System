<?php
session_start();
if (!isset($_SESSION['uid'])) { header("Location: ../index.php"); exit; }
if ($_SESSION['urole'] !== 'admin') { header("Location: ../index.php"); exit; }
include '../db.php';

$ok  = "";
$err = "";

// Save updated rates to config.php
if (isset($_POST['save_rates'])) {
    $fields = ['BASE_RATE','RES_FACTOR','COM_FACTOR','IND_FACTOR','REBATE_PERCENT','PENALTY_PERCENT','PENALTY_CAP'];
    $new = array();
    $valid = true;
    foreach ($fields as $f) {
        $val = $_POST[$f];
        // numeric, non-negative
        if (!is_numeric($val) || $val < 0) { $valid = false; break; }
        $new[$f] = (float)$val;
    }
    if (!$valid) {
        $err = "All rates must be non-negative numbers.";
    } else {
        // build the PHP config file content
        $content = "<?php\n// Editable tax-rate config. Written by admin/manage_rates.php.\n";
        $content .= "// Stored as a PHP array file (not a DB table) so we stay at six tables.\nreturn array(\n";
        foreach ($new as $k => $v) {
            $content .= "    '$k' => $v,\n";
        }
        $content .= ");\n";
        if (file_put_contents(__DIR__ . '/../config.php', $content) !== false) {
            $ok = "Tax rates updated successfully. New rates apply to all future tax calculations.";
        } else {
            $err = "Could not write config.php. Check file permissions.";
        }
    }
}

// current rates (re-read to reflect any just-saved change)
$cfg = include __DIR__ . '/../config.php';
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Manage Rates - Nagarpalika</title>
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
        <a href="manage_rates.php" class="active">Manage Rates</a>
        <a href="reports.php">Reports</a>
        <a href="manage_users.php">Manage Users</a>
        <a href="add_officer.php">Add Officer</a>
    </div>
    <div class="main">
        <h1 class="page-title">Manage Tax Rates</h1>

        <?php if ($ok  != "") echo "<div class='msg msg-ok'>$ok</div>"; ?>
        <?php if ($err != "") echo "<div class='msg msg-err'>$err</div>"; ?>

        <div class="panel">
            <div class="panel-header">Edit Tax Rates</div>
            <div class="panel-body">
                <form method="post">
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Base Rate (per sqft)</label>
                            <input type="number" step="0.01" name="BASE_RATE" required value="<?php echo $cfg['BASE_RATE']; ?>">
                        </div>
                        <div class="form-group">
                            <label>Residential Factor</label>
                            <input type="number" step="0.01" name="RES_FACTOR" required value="<?php echo $cfg['RES_FACTOR']; ?>">
                        </div>
                        <div class="form-group">
                            <label>Commercial Factor</label>
                            <input type="number" step="0.01" name="COM_FACTOR" required value="<?php echo $cfg['COM_FACTOR']; ?>">
                        </div>
                        <div class="form-group">
                            <label>Industrial Factor</label>
                            <input type="number" step="0.01" name="IND_FACTOR" required value="<?php echo $cfg['IND_FACTOR']; ?>">
                        </div>
                        <div class="form-group">
                            <label>Rebate % (if paid before due date)</label>
                            <input type="number" step="0.01" name="REBATE_PERCENT" required value="<?php echo $cfg['REBATE_PERCENT']; ?>">
                        </div>
                        <div class="form-group">
                            <label>Penalty % per month (late)</label>
                            <input type="number" step="0.01" name="PENALTY_PERCENT" required value="<?php echo $cfg['PENALTY_PERCENT']; ?>">
                        </div>
                        <div class="form-group full">
                            <label>Penalty Cap % (maximum)</label>
                            <input type="number" step="0.01" name="PENALTY_CAP" required value="<?php echo $cfg['PENALTY_CAP']; ?>">
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="submit" name="save_rates" class="btn btn-primary">Save Rates</button>
                    </div>
                </form>
            </div>
        </div>

        <div class="panel">
            <div class="panel-header">How the Tax is Computed</div>
            <div class="panel-body">
                <p><strong>Base Tax</strong> = Area (sqft) &times; Base Rate &times; Usage Factor &times; Age Factor</p>
                <ul style="margin: 10px 0 10px 20px;">
                    <li>Usage Factor: Residential = <?php echo $cfg['RES_FACTOR']; ?>, Commercial = <?php echo $cfg['COM_FACTOR']; ?>, Industrial = <?php echo $cfg['IND_FACTOR']; ?></li>
                    <li>Age Factor: 1.0 if built &le;10 yrs ago, 0.95 if 11&ndash;20 yrs, 0.9 if 20+ yrs</li>
                </ul>
                <p><strong>Final Due</strong> = Base Tax &minus; Rebate (if paid early) + Penalty (if paid late)</p>
                <ul style="margin: 10px 0 0 20px;">
                    <li>Rebate: <?php echo $cfg['REBATE_PERCENT']; ?>% off if paid on or before the due date</li>
                    <li>Penalty: <?php echo $cfg['PENALTY_PERCENT']; ?>% per month late, capped at <?php echo $cfg['PENALTY_CAP']; ?>%</li>
                </ul>
            </div>
        </div>
    </div>
</div>
</body>
</html>
