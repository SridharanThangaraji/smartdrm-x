def analyze_usage(log):
    from backend.app.ai_engine.features import extract_features
    from backend.app.ai_engine.detector import detect_anomaly

    features = extract_features(log)
    return detect_anomaly(features)
