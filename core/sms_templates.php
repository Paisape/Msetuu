<?php
/**
 * DLT SMS Template Master
 * Core helper for retrieving and building DLT compliant SMS content.
 * Project: Paisape / MandirSetu
 */

if (!defined('DEFAULT_OTP_TEMPLATE_ID')) {
    define('DEFAULT_OTP_TEMPLATE_ID', '1177178593496518428');
}

if (!defined('DEFAULT_OTP_TEMPLATE_CONTENT')) {
    define('DEFAULT_OTP_TEMPLATE_CONTENT', 'Welcome to Paisape. Use OTP {#num#} to verify your Paisape account. This OTP is valid for 10 minutes. Do not share this OTP with anyone. - Paisape -Paisape');
}

/**
 * Returns registered DLT SMS templates catalog
 * 
 * @return array
 */
function get_dlt_sms_templates() {
    return [
        DEFAULT_OTP_TEMPLATE_ID => [
            'name' => 'Paisape OTP Verification',
            'template_id' => DEFAULT_OTP_TEMPLATE_ID,
            'content' => DEFAULT_OTP_TEMPLATE_CONTENT,
            'variables' => ['{#num#}']
        ]
    ];
}

/**
 * Format SMS message with runtime variable replacements
 * 
 * @param string $template_id
 * @param array $variables Key-value map of variable replacements, e.g. ['{#num#}' => '123456']
 * @return string
 */
function render_dlt_sms($template_id, $variables = []) {
    $templates = get_dlt_sms_templates();
    $content = isset($templates[$template_id]) ? $templates[$template_id]['content'] : DEFAULT_OTP_TEMPLATE_CONTENT;

    foreach ($variables as $key => $val) {
        $content = str_replace($key, $val, $content);
    }

    return $content;
}

/**
 * Render OTP message using Paisape DLT default template
 * Replaces {#num#} with real OTP at send time.
 * 
 * @param string|int $otp
 * @return string
 */
function render_otp_sms($otp) {
    return str_replace('{#num#}', (string)$otp, DEFAULT_OTP_TEMPLATE_CONTENT);
}
