<?php
session_start();
if (!isset($_SESSION['uid'])) { header("Location: ../index.php"); exit; }
if ($_SESSION['urole'] !== 'admin') { header("Location: ../index.php"); exit; }
include '../db.php';

$ok  = "";

// activate / deactivate (cannot deactivate self)
if (isset($_GET['action']) && isset($_GET['uid'])) {
    $target = (int)$_GET['uid'];
    $action = mysqli_real_escape_string($con, $_GET['action']);
    if ($target == $_SESSION['uid']) {
        $ok = "You cannot change your own status.";
    } elseif ($action == 'activate' || $action == 'deactivate') {
        $newStatus = ($action == 'activate') ? 'active' : 'inactive';
        $sql = "UPDATE usermaster SET status='$newStatus' WHERE uid=$target";
        if (mysqli_query($con, $sql)) {
            $ok = "User #$target is now $newStatus.";
        }
    }
}

// optional role filter
$roleFilter = isset($_GET['role']) ? mysqli_real_escape_string($con, $_GET['role']) : "";
$where = "";
if (in_array($roleFilter, ['citizen','officer','admin'])) $where = "WHERE urole='$roleFilter'";

$users = mysqli_query($con, "SELECT * FROM usermaster $where ORDER BY uid ASC");
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Manage Users - Nagarpalika</title>
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
        <a href="manage_users.php" class="active">Manage Users</a>
        <a href="add_officer.php">Add Officer</a>
    </div>
    <div class="main">
        <h1 class="page-title">Manage User Accounts</h1>

        <?php if ($ok != "") echo "<div class='msg msg-ok'>$ok</div>"; ?>

        <div class="panel">
            <div class="panel-header">Filter by Role</div>
            <div class="panel-body">
                <a href="manage_users.php" class="btn btn-sm <?php echo $roleFilter==''?'btn-primary':'btn-warning'; ?>">All</a>
                <a href="manage_users.php?role=citizen" class="btn btn-sm <?php echo $roleFilter=='citizen'?'btn-primary':'btn-warning'; ?>">Citizens</a>
                <a href="manage_users.php?role=officer" class="btn btn-sm <?php echo $roleFilter=='officer'?'btn-primary':'btn-warning'; ?>">Officers</a>
                <a href="manage_users.php?role=admin" class="btn btn-sm <?php echo $roleFilter=='admin'?'btn-primary':'btn-warning'; ?>">Admins</a>
            </div>
        </div>

        <div class="panel">
            <div class="panel-header">Users (<?php echo mysqli_num_rows($users); ?>)</div>
            <div class="panel-body">
                <table>
                    <thead><tr>
                        <th>ID</th><th>Name</th><th>Email</th><th>Phone</th>
                        <th>Role</th><th>Status</th><th>Action</th>
                    </tr></thead>
                    <tbody>
                    <?php while ($u = mysqli_fetch_array($users)) {
                        $badge = "badge-" . $u['status'];
                        $isSelf = ($u['uid'] == $_SESSION['uid']);
                        echo "<tr>
                            <td>{$u['uid']}</td>
                            <td>{$u['uname']}" . ($isSelf ? " <span class='muted'>(you)</span>" : "") . "</td>
                            <td>{$u['email']}</td>
                            <td>{$u['phone']}</td>
                            <td>" . ucfirst($u['urole']) . "</td>
                            <td><span class='badge $badge'>{$u['status']}</span></td>
                            <td>";
                        if ($isSelf) {
                            echo "<span class='muted'>-</span>";
                        } elseif ($u['status'] == 'active') {
                            echo "<a href='manage_users.php?action=deactivate&uid={$u['uid']}' class='btn btn-danger btn-sm' onclick=\"return confirm('Deactivate this user?')\">Deactivate</a>";
                        } else {
                            echo "<a href='manage_users.php?action=activate&uid={$u['uid']}' class='btn btn-success btn-sm' onclick=\"return confirm('Activate this user?')\">Activate</a>";
                        }
                        echo "</td></tr>";
                    } ?>
                    </tbody>
                </table>
            </div>
        </div>

        <p class="muted">Deactivated users cannot log in. Officers and admins are typically inserted directly via phpMyAdmin; citizens register themselves through the site.</p>
    </div>
</div>
</body>
</html>
