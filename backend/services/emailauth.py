import smtplib
import re
import dns.resolver

def validate_email_syntax(email):
    """Check if the email has a basic valid syntax using regex."""
    pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
    return re.match(pattern, email) is not None

def get_mx_records(domain):
    """Retrieve MX records for the given domain."""
    try:
        answers = dns.resolver.resolve(domain, 'MX')
        # Sort by preference (lowest value is highest priority)
        records = sorted(answers, key=lambda r: r.preference)
        mx_records = [record.exchange.to_text().strip('.') for record in records]
        # If the only record is empty after stripping, it's invalid.
        if not any(mx_records):
            return None
        return mx_records
    except Exception as e:
        return None

def verify_email_smtp(email, from_address="nidaeman0002@gmail.com"):
    """
    Verify email existence by connecting to the domain's SMTP server
    and issuing MAIL FROM and RCPT TO commands.
    """
    # Step 1: Validate syntax
    if not validate_email_syntax(email):
        return False

    # Step 2: Get domain MX records
    domain = email.split('@')[1]
    mx_records = get_mx_records(domain)
    if not mx_records:
        return False

    # Choose the first valid MX record
    mx_record = mx_records[0]

    try:
        # Connect to the SMTP server on port 25
        server = smtplib.SMTP(timeout=10)
        server.set_debuglevel(1)  # Debug output
        server.connect(mx_record, 25)
        server.helo(server.local_hostname)
        server.mail(from_address)
        code, message = server.rcpt(email)
        server.quit()

        if code == 250:
            return True
        else:
            return False

    except Exception as e:
        return False
