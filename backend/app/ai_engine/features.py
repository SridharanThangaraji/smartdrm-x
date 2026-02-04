def extract_features(log):
    return {
        "downloads": log.get("downloads", 0),
        "ip_count": log.get("ip_count", 1)
    }
