<?php
// Editable tax-rate config. Written by admin/manage_rates.php.
// Stored as a PHP array file (not a DB table) so we stay at six tables.
return array(
    'BASE_RATE'      => 2,
    'RES_FACTOR'     => 1.0,
    'COM_FACTOR'     => 2.0,
    'IND_FACTOR'     => 2.5,
    'REBATE_PERCENT' => 10,
    'PENALTY_PERCENT'=> 2,
    'PENALTY_CAP'    => 12,
);
