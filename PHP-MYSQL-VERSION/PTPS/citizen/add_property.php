<?php
session_start();
if (!isset($_SESSION['uid'])) { header("Location: ../index.php"); exit; }
if ($_SESSION['urole'] !== 'citizen') { header("Location: ../index.php"); exit; }
include '../db.php';
$uid = $_SESSION['uid'];

$err = "";
$ok  = "";

if (isset($_POST['save'])) {
    $tno     = mysqli_real_escape_string($con, $_POST['tno']);
    $address = mysqli_real_escape_string($con, $_POST['address']);
    $wid     = (int)$_POST['wid'];
    $areasq  = (int)$_POST['areasq'];
    $ptype   = mysqli_real_escape_string($con, $_POST['ptype']);
    $cyear   = (int)$_POST['cyear'];

    if ($wid <= 0 || $areasq <= 0 || $cyear <= 1900 || $cyear > date('Y')) {
        $err = "Please fill all fields with valid values.";
    } else {
        $sql = "INSERT INTO propertymaster (uid, tno, address, wid, areasq, ptype, cyear, status)
                VALUES ($uid, '$tno', '$address', $wid, $areasq, '$ptype', $cyear, 'pending')";
        if (mysqli_query($con, $sql)) {
            $ok = "Property registered successfully. It is now pending verification by an officer.";
        } else {
            $err = "Failed: " . mysqli_error($con);
        }
    }
}

// fetch wards for dropdown
$wards = mysqli_query($con, "SELECT * FROM wardmaster ORDER BY wardno");
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Add Property - Nagarpalika</title>
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
        <a href="add_property.php" class="active">Add Property</a>
        <a href="pay_tax.php">Pay Tax</a>
        <a href="grievance.php">Grievances</a>
    </div>
    <div class="main">
        <h1 class="page-title">Register a Property</h1>

        <?php if ($err != "") echo "<div class='msg msg-err'>$err</div>"; ?>
        <?php if ($ok  != "") echo "<div class='msg msg-ok'>$ok</div>"; ?>

        <div class="panel">
            <div class="panel-header">Property Details</div>
            <div class="panel-body">
                <form method="post">
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Tenement Number (e.g. VLD-0142)</label>
                            <input type="text" name="tno" required placeholder="VLD-0142">
                        </div>
                        <div class="form-group">
                            <label>Ward</label>
                            <select name="wid" required>
                                <option value="">-- Select Ward --</option>
                                <?php
                                while ($w = mysqli_fetch_array($wards)) {
                                    echo "<option value='{$w['wid']}'>{$w['wardno']} - {$w['zone']}</option>";
                                }
                                ?>
                            </select>
                        </div>
                        <div class="form-group full">
                            <label>Address</label>
                            <input type="text" name="address" required placeholder="Full property address">
                        </div>
                        <div class="form-group">
                            <label>Area (sqft)</label>
                            <input type="number" name="areasq" required min="1" placeholder="1200">
                        </div>
                        <div class="form-group">
                            <label>Property Type</label>
                            <select name="ptype" required>
                                <option value="">-- Select --</option>
                                <option value="residential">Residential</option>
                                <option value="commercial">Commercial</option>
                                <option value="industrial">Industrial</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Year Built</label>
                            <input type="number" name="cyear" required min="1900" max="<?php echo date('Y'); ?>" placeholder="2010">
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="submit" name="save" class="btn btn-primary">Register Property</button>
                        <a href="dashboard.php" class="btn btn-warning">Cancel</a>
                    </div>
                </form>
            </div>
        </div>

        <p class="muted">Your property will be reviewed by a verification officer. Tax is generated only after verification.</p>
    </div>
</div>
</body>
</html>
