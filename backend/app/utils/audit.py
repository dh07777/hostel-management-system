import json
from flask import request
from app.models import db, AuditLog

def log_audit_trail(action, module, details=None, user_id=None):
    try:
        ip = request.remote_addr if request else '127.0.0.1'
        details_str = json.dumps(details) if isinstance(details, (dict, list)) else (str(details) if details else None)
        log = AuditLog(
            user_id=user_id,
            action=action,
            module=module,
            details=details_str,
            ip_address=ip
        )
        db.session.add(log)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"Audit log error: {e}")
