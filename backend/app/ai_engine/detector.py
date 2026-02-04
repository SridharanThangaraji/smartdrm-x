def detect_anomaly(features):
    if features["downloads"] > 10:
        return "SUSPICIOUS"
    return "NORMAL"
