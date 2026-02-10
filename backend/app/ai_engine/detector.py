def detect_anomaly(features: dict):
    """
    Analyzes features to return a risk score and level.
    """
    risk_score = 0
    reasons = []

    # Rule 1: High frequency downloads
    if features["downloads_24h"] > 50:
        risk_score += 40
        reasons.append("High download volume")
    elif features["downloads_24h"] > 20:
        risk_score += 20
        reasons.append("Moderate download volume")

    # Rule 2: Access Denied
    if features["denied_24h"] > 5:
        risk_score += 30
        reasons.append("Multiple access denials")

    # Rule 3: Asset Hoarding
    if features["unique_assets_24h"] > 15:
        risk_score += 20
        reasons.append("Accessing many different assets")

    # Rule 4: IP Hopping (Mocked logic as we don't capture IP yet)
    if features.get("unique_ips_24h", 0) > 3:
         risk_score += 25
         reasons.append("Multiple IP addresses used")

    # Determine Level
    level = "LOW"
    if risk_score >= 70:
        level = "HIGH"
    elif risk_score >= 30:
        level = "MEDIUM"
        
    return {
        "risk_score": min(risk_score, 100),
        "risk_level": level,
        "reasons": reasons
    }
