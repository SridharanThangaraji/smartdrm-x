def check_access(license_data):
    if not license_data["active"]:
        return False
    if license_data["access_used"] >= license_data["access_limit"]:
        return False
    return True
