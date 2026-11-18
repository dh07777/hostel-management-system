import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import current_app

def send_notification_email(recipient_email, subject, body_html, test_mode=True):
    """
    Sends notification email or logs to console/file in test mode.
    """
    config = current_app.config
    is_test = config.get('MAIL_TEST_MODE', True) or test_mode or not config.get('MAIL_USERNAME')

    if is_test:
        print(f"\n[EMAIL TEST MODE] To: {recipient_email}")
        print(f"Subject: {subject}")
        print(f"Content:\n{body_html}\n----------------------------------")
        return {'status': 'success', 'mode': 'test_mode', 'message': f'Simulated email dispatched to {recipient_email}'}

    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = config.get('MAIL_DEFAULT_SENDER')
        msg['To'] = recipient_email

        part = MIMEText(body_html, 'html')
        msg.attach(part)

        server = smtplib.SMTP(config.get('MAIL_SERVER'), config.get('MAIL_PORT'))
        if config.get('MAIL_USE_TLS'):
            server.starttls()
        server.login(config.get('MAIL_USERNAME'), config.get('MAIL_PASSWORD'))
        server.sendmail(config.get('MAIL_DEFAULT_SENDER'), recipient_email, msg.as_string())
        server.quit()

        return {'status': 'success', 'mode': 'smtp', 'message': f'Email delivered to {recipient_email}'}
    except Exception as e:
        print(f"[EMAIL ERROR] Failed to send email to {recipient_email}: {e}")
        return {'status': 'error', 'mode': 'smtp', 'error': str(e)}
