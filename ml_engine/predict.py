"""
Standalone prediction module for the ML engine.
Used by the FastAPI backend prediction service.
"""
import joblib
import numpy as np
import os
import logging

logger = logging.getLogger(__name__)

MODEL_PATH = os.path.join(os.path.dirname(__file__), "packaging_model.pkl")
FEATURE_COLUMNS = ["length", "width", "height", "weight", "volume", "dim_weight", "chargeable_weight"]

_bundle = None

def load_model():
    global _bundle
    if _bundle is not None:
        return _bundle
    if not os.path.exists(MODEL_PATH):
        logger.warning(f"Model not found at {MODEL_PATH}")
        return None
    try:
        _bundle = joblib.load(MODEL_PATH)
        logger.info(f"Model loaded. Classes: {_bundle['classes']} | Accuracy: {_bundle['accuracy']:.4f}")
        return _bundle
    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        return None

def predict_packaging(length: float, width: float, height: float, weight: float) -> dict:
    """
    Predict best packaging box for given product dimensions.
    Returns recommended_box and confidence_score.
    """
    # Validate
    if any(v <= 0 for v in [length, width, height, weight]):
        raise ValueError("All dimensions and weight must be greater than 0")

    bundle = load_model()
    if bundle is None:
        raise RuntimeError("ML model is not available")

    volume = length * width * height
    dim_weight = volume / 5000.0
    chargeable_weight = max(weight, dim_weight)

    features = np.array([[length, width, height, weight, volume, dim_weight, chargeable_weight]])
    model = bundle["model"]

    prediction = model.predict(features)[0]
    probabilities = model.predict_proba(features)[0]
    confidence = float(np.max(probabilities))

    return {
        "recommended_box": prediction,
        "confidence_score": round(confidence, 4),
    }

if __name__ == "__main__":
    # Quick test
    result = predict_packaging(30, 20, 15, 2.5)
    print("Prediction:", result)
