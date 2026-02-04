from backend.app.utils.audit_logger import log_event


log_event("ASSET_UPLOADED", {
    "asset_hash": asset_hash
})

