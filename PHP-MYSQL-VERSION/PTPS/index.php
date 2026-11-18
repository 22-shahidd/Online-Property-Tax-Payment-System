<?php
session_start();
include 'db.php';

// If already logged in, send to role dashboard
if (isset($_SESSION['uid'])) {
    if ($_SESSION['urole'] == 'admin')   header("Location: admin/dashboard.php");
    elseif ($_SESSION['urole'] == 'officer') header("Location: officer/dashboard.php");
    else header("Location: citizen/dashboard.php");
    exit;
}

$err = "";
$ok  = "";

// REGISTER (only citizens self-register)
if (isset($_POST['register'])) {
    $uname  = mysqli_real_escape_string($con, $_POST['uname']);
    $email  = mysqli_real_escape_string($con, $_POST['email']);
    $upwd   = mysqli_real_escape_string($con, $_POST['upwd']);
    $phone  = mysqli_real_escape_string($con, $_POST['phone']);
    // duplicate email check
    $chk = mysqli_query($con, "SELECT uid FROM usermaster WHERE email='$email'");
    if (mysqli_num_rows($chk) > 0) {
        $err = "Email already registered. Please login.";
    } else {
        $sql = "INSERT INTO usermaster (uname, email, upwd, urole, phone, status)
                VALUES ('$uname', '$email', '$upwd', 'citizen', '$phone', 'active')";
        if (mysqli_query($con, $sql)) {
            $ok = "Registration successful. Please login.";
        } else {
            $err = "Registration failed: " . mysqli_error($con);
        }
    }
}

// LOGIN
if (isset($_POST['login'])) {
    $email = mysqli_real_escape_string($con, $_POST['email']);
    $upwd  = mysqli_real_escape_string($con, $_POST['upwd']);
    $sql = "SELECT * FROM usermaster WHERE email='$email' AND upwd='$upwd'";
    $result = mysqli_query($con, $sql);
    if (mysqli_num_rows($result) == 1) {
        $row = mysqli_fetch_array($result);
        if ($row['status'] == 'inactive') {
            $err = "Your account is deactivated. Contact the admin.";
        } else {
            $_SESSION['uid']   = $row['uid'];
            $_SESSION['uname'] = $row['uname'];
            $_SESSION['urole'] = $row['urole'];
            if ($row['urole'] == 'admin')   header("Location: admin/dashboard.php");
            elseif ($row['urole'] == 'officer') header("Location: officer/dashboard.php");
            else header("Location: citizen/dashboard.php");
            exit;
        }
    } else {
        $err = "Invalid email or password.";
    }
}
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Nagarpalika Property Tax System</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body class="auth-body">
<div class="auth-card">
    <div class="auth-brand">
        <h1>Nagarpalika</h1>
        <p>Online Property Tax Payment System</p>
    </div>

    <?php if ($err != "") echo "<div class='msg msg-err'>$err</div>"; ?>
    <?php if ($ok  != "") echo "<div class='msg msg-ok'>$ok</div>"; ?>

    <div class="auth-tabs">
        <button type="button" class="tab-btn active" onclick="switchTab('login')">Login</button>
        <button type="button" class="tab-btn" onclick="switchTab('register')">Register</button>
    </div>

    <!-- LOGIN -->
    <form method="post" id="loginForm" class="auth-form">
        <label>Email</label>
        <input type="email" name="email" required placeholder="you@example.com">
        <label>Password</label>
        <input type="password" name="upwd" required placeholder="Password">
        <button type="submit" name="login" class="btn btn-primary">Login</button>
    </form>

    <!-- REGISTER -->
    <form method="post" id="registerForm" class="auth-form" style="display:none;">
        <label>Full Name</label>
        <input type="text" name="uname" required placeholder="Your name">
        <label>Email</label>
        <input type="email" name="email" required placeholder="you@example.com">
        <label>Phone (10 digits)</label>
        <input type="text" name="phone" required pattern="[0-9]{10}" placeholder="9876543210">
        <label>Password</label>
        <input type="password" name="upwd" required placeholder="Choose a password">
        <button type="submit" name="register" class="btn btn-primary">Register as Citizen</button>
        <p class="hint">Officers and admins are created by the system administrator.</p>
    </form>
</div>

<script>
function switchTab(which) {
    document.getElementById('loginForm').style.display    = (which == 'login') ? 'block' : 'none';
    document.getElementById('registerForm').style.display = (which == 'register') ? 'block' : 'none';
    var btns = document.querySelectorAll('.tab-btn');
    btns.forEach(function(b){ b.classList.remove('active'); });
    event.target.classList.add('active');
}
</script>
</body>
</html>
