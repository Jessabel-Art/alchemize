<?php
require_once __DIR__ . '/../../server/http/request.php';
require_once __DIR__ . '/../../server/repositories/settings-repository.php';
$valid = AlchemizeSettingsRepository::normalize(['portal_message_email_notifications' => 'false', 'staff_notification_delivery_mode' => 'email', 'appointment_default_duration' => 75, 'invoice_payment_terms_days' => 0, 'unknown_secret' => 'hidden']);
if ($valid !== ['portal_message_email_notifications' => false, 'staff_notification_delivery_mode' => 'email', 'appointment_default_duration' => 75, 'invoice_payment_terms_days' => 0]) throw new RuntimeException('Normalization failed');
foreach ([['business_name' => ''], ['business_email' => 'bad'], ['timezone' => 'invalid'], ['appointment_default_duration' => 14], ['appointment_default_duration' => 30.5], ['appointment_default_duration' => '60'], ['portal_message_email_notifications' => 'maybe'], ['staff_notification_delivery_mode' => 'fax'], ['default_client_language' => 'xx'], ['default_meeting_method' => 'invalid'], ['invoice_payment_terms_days' => -1], ['prospect_follow_up_days' => 0]] as $invalid) {
    try { AlchemizeSettingsRepository::normalize($invalid); } catch (AlchemizeRequestException $error) { continue; }
    throw new RuntimeException('Invalid value accepted: ' . json_encode($invalid));
}
echo "Settings normalization: 13 checks passed.\n";
