def analyze_usage(user_id: int):
    from app.ai_engine.features import extract_features
    from app.ai_engine.detector import detect_anomaly

    features = extract_features(user_id)
    return detect_anomaly(features)
