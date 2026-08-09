<?php
/**
 * Textzi SMS Gateway Integration Helper
 * Core module for dispatching SMS via Textzi Gateway GET URL API with DLT Template support.
 * Project: Paisape / MandirSetu
 */

require_once __DIR__ . '/sms_templates.php';

/**
 * Format mobile number to standard 12-digit string prefixed with country code 91
 *
 * @param string $mobile
 * @return string
 */
function format_textzi_mobile($mobile) {
    $clean = preg_replace('/[^0-9]/', '', (string)$mobile);
    if (strlen($clean) === 10) {
        return '91' . $clean;
    }
    return $clean;
}

/**
 * Send SMS using Textzi GET URL API
 * Endpoint: GET https://api.textzi.in/v1/sms/send-url
 *
 * @param string $mobile Mobile number (10-digit or 12-digit with 91)
 * @param string $message SMS message text (will be URL encoded)
 * @param string|null $template_id DLT Template ID (optional, defaults to TEXTZI_TEMPLATE_ID or DLT Master default)
 * @return array Response payload array with success boolean and details
 */
function send_textzi_sms($mobile, $message, $template_id = null) {
    $apiKey = getenv('TEXTZI_API_KEY') ?: '';
    $userId = getenv('TEXTZI_USER_ID') ?: '';
    $defaultTemplateId = getenv('TEXTZI_TEMPLATE_ID') ?: DEFAULT_OTP_TEMPLATE_ID;

    $activeTemplateId = $template_id ?: $defaultTemplateId;
    $formattedMobile = format_textzi_mobile($mobile);

    if (empty($apiKey) || empty($userId)) {
        return [
            'success' => false,
            'message' => 'Textzi SMS credentials (TEXTZI_API_KEY / TEXTZI_USER_ID) not configured.'
        ];
    }

    $params = [
        'api_key' => $apiKey,
        'user_id' => $userId,
        'mobile' => $formattedMobile,
        'template_id' => $activeTemplateId,
        'message' => $message
    ];

    $apiUrl = 'https://api.textzi.in/v1/sms/send-url?' . http_build_query($params);

    if (function_exists('curl_init')) {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $apiUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 15);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($curlError) {
            return [
                'success' => false,
                'message' => 'cURL Error: ' . $curlError,
                'http_code' => $httpCode
            ];
        }

        $decoded = json_decode($response, true);
        return [
            'success' => ($httpCode >= 200 && $httpCode < 300),
            'http_code' => $httpCode,
            'response' => $decoded !== null ? $decoded : $response
        ];
    }

    // Fallback if cURL is disabled
    $context = stream_context_create(['http' => ['method' => 'GET', 'timeout' => 15]]);
    $response = @file_get_contents($apiUrl, false, $context);

    if ($response === false) {
        return [
            'success' => false,
            'message' => 'HTTP request failed via file_get_contents'
        ];
    }

    $decoded = json_decode($response, true);
    return [
        'success' => true,
        'response' => $decoded !== null ? $decoded : $response
    ];
}

/**
 * Reusable helper: Send Paisape OTP SMS using registered DLT Template
 *
 * @param string $mobile Devotee/User mobile number
 * @param string|int $otp 6-digit OTP code
 * @param string|null $template_id Optional override for DLT Template ID
 * @return array Response payload array
 */
function send_otp_sms($mobile, $otp, $template_id = null) {
    $message = render_otp_sms($otp);
    $activeTemplateId = $template_id ?: DEFAULT_OTP_TEMPLATE_ID;

    return send_textzi_sms($mobile, $message, $activeTemplateId);
}
