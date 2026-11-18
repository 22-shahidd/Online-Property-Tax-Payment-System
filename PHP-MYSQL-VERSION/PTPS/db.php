<?php
// Database connection - the ONLY connection pattern used in this project
$con = mysqli_connect("localhost", "root", "", "property_tax_db") or die(mysqli_connect_error());

// Tax formula rates - loaded from config.php (editable by admin via manage_rates.php)
// so we stay at six tables. Falls back to defaults if the file is missing.
$cfgFile = __DIR__ . '/config.php';
if (file_exists($cfgFile)) {
    $cfg = include $cfgFile;
} else {
    $cfg = array(
        'BASE_RATE'       => 2,
        'RES_FACTOR'      => 1.0,
        'COM_FACTOR'      => 2.0,
        'IND_FACTOR'      => 2.5,
        'REBATE_PERCENT'  => 10,
        'PENALTY_PERCENT' => 2,
        'PENALTY_CAP'     => 12,
    );
}
define('BASE_RATE',       $cfg['BASE_RATE']);
define('RES_FACTOR',      $cfg['RES_FACTOR']);
define('COM_FACTOR',      $cfg['COM_FACTOR']);
define('IND_FACTOR',      $cfg['IND_FACTOR']);
define('REBATE_PERCENT',  $cfg['REBATE_PERCENT']);
define('PENALTY_PERCENT', $cfg['PENALTY_PERCENT']);
define('PENALTY_CAP',     $cfg['PENALTY_CAP']);

// Usage factor lookup by property type
function usageFactor($ptype) {
    if ($ptype == 'residential') return RES_FACTOR;
    if ($ptype == 'commercial')  return COM_FACTOR;
    if ($ptype == 'industrial')  return IND_FACTOR;
    return 1.0;
}

// Age factor: 1.0 if built <=10 yrs ago, 0.95 if 11-20 yrs, 0.9 if 20+ yrs
function ageFactor($cyear) {
    $age = date('Y') - $cyear;
    if ($age <= 10) return 1.0;
    if ($age <= 20) return 0.95;
    return 0.9;
}

// Compute base tax for a property row (areasq, ptype, cyear)
function computeBaseTax($areasq, $ptype, $cyear) {
    return $areasq * BASE_RATE * usageFactor($ptype) * ageFactor($cyear);
}

// Compute final due given base tax, due date, and today
// Rebate if paid before due date; penalty if after (per month, capped)
function computeFinalDue($baseTax, $duedate, $today = null) {
    if ($today === null) $today = date('Y-m-d');
    if ($today <= $duedate) {
        $rebate = $baseTax * (REBATE_PERCENT / 100);
        return $baseTax - $rebate;
    }
    // late: PENALTY_PERCENT per month, capped at PENALTY_CAP
    $ts1 = strtotime($duedate);
    $ts2 = strtotime($today);
    $months = 0;
    if ($ts2 > $ts1) {
        $diff = ($ts2 - $ts1) / (30 * 24 * 60 * 60);
        $months = (int) $diff;
        if ($months < 1) $months = 1;
    }
    $pct = $months * PENALTY_PERCENT;
    if ($pct > PENALTY_CAP) $pct = PENALTY_CAP;
    $penalty = $baseTax * ($pct / 100);
    return $baseTax + $penalty;
}
