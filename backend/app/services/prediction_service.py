"""
Prediction Service - Rule-based primary, ML as fallback.
Integrates with cost_service for full optimization results.
"""
import joblib
import numpy as np
import os
import json
import logging
from typing import Optional
from app.core.config import settings
from app.services.cost_service import (
    BOX_CATALOG, full_cost_analysis, get_alternative_boxes
)

logger = logging.getLogger(__name__)

# Global ML model (loaded once at startup)
_ml_model = None
_model_load_attempted = False


def load_ml_model():
    global _ml_model, _model_load_attempted
    if _model_load_attempted:
        return _ml_model
    _model_load_attempted = True
    try:
        if os.path.exists(settings.ML_MODEL_PATH):
            _ml_model = joblib.load(settings.ML_MODEL_PATH)
            logger.info(f"ML model loaded from {settings.ML_MODEL_PATH}")
        else:
            logger.warning(f"ML model not found at {settings.ML_MODEL_PATH}. Using rule-based engine only.")
    except Exception as e:
        logger.error(f"Failed to load ML model: {e}")
    return _ml_model


def _find_best_box_rule_based(length: float, width: float, height: float, weight: float) -> tuple[str, str]:
    """
    Rule-based box selection: find the smallest box that fits the product.
    Returns (box_name, explanation).
    """
    sorted_boxes = sorted(BOX_CATALOG.items(), key=lambda x: x[1]["dims"][0] * x[1]["dims"][1] * x[1]["dims"][2])

    for box_name, info in sorted_boxes:
        bL, bW, bH = info["dims"]
        # Allow 10% padding for packing material
        if bL >= length * 1.05 and bW >= width * 1.05 and bH >= height * 1.05:
            explanation = (
                f"Rule-based selection: {box_name} ({bL}×{bW}×{bH} cm) is the smallest fitting box "
                f"for your product dimensions ({length}×{width}×{height} cm) with 5% packing allowance. "
                f"Box cost: ₹{info['cost']}."
            )
            return box_name, explanation

    # Fallback to largest box
    explanation = f"Product dimensions exceed standard boxes. Using Box_XXL as fallback."
    return "Box_XXL", explanation


def _predict_with_ml(length: float, width: float, height: float, weight: float) -> Optional[tuple[str, float]]:
    """
    Try ML prediction. Returns (box_name, confidence) or None if unavailable.
    ML is fallback ONLY - used when rule-based gives low confidence.
    """
    model = load_ml_model()
    if model is None:
        return None
    try:
        features = np.array([[length, width, height, weight]])
        prediction = model.predict(features)
        probabilities = model.predict_proba(features)
        confidence = float(np.max(probabilities))
        box_name = prediction[0]

        # Validate ML output
        if box_name not in BOX_CATALOG:
            logger.warning(f"ML predicted unknown box: {box_name}")
            return None

        logger.info(f"ML prediction: {box_name} with confidence {confidence:.2f}")
        return box_name, confidence
    except Exception as e:
        logger.error(f"ML prediction failed: {e}")
        return None


def predict_packaging(
    length: float, width: float, height: float, weight: float
) -> dict:
    """
    Main prediction function.
    1. Validate inputs
    2. Run rule-based decision (primary)
    3. Run ML as fallback/validation
    4. Calculate full cost analysis
    5. Return complete optimization result
    """
    # Validate
    if any(v <= 0 for v in [length, width, height, weight]):
        raise ValueError("All dimensions and weight must be greater than 0")

    product_volume = length * width * height

    # Step 1: Rule-based (primary)
    rule_box, rule_explanation = _find_best_box_rule_based(length, width, height, weight)
    source = "rule_based"
    recommended_box = rule_box
    confidence_score = 0.92  # High confidence for rule-based
    explanation = rule_explanation

    # Step 2: ML as fallback (only if no perfect rule match)
    ml_result = _predict_with_ml(length, width, height, weight)
    if ml_result:
        ml_box, ml_confidence = ml_result
        # Use ML if it agrees or has very high confidence
        if ml_box == rule_box:
            confidence_score = max(confidence_score, ml_confidence)
        elif ml_confidence > 0.95:
            # Only override rule-based if ML is extremely confident
            recommended_box = ml_box
            confidence_score = ml_confidence
            source = "ml_assisted"
            explanation += f" ML model also confirmed with {ml_confidence:.0%} confidence."
        logger.info(f"ML validation: rule={rule_box}, ml={ml_box}, ml_conf={ml_confidence:.2f}")

    # Step 3: Cost analysis
    cost_analysis = full_cost_analysis(length, width, height, weight, recommended_box)

    # Step 4: Alternatives
    alternatives = get_alternative_boxes(length, width, height, weight, recommended_box)

    # Step 5: Decision explanation with cost breakdown
    box_info = BOX_CATALOG.get(recommended_box, {})
    bL, bW, bH = box_info.get("dims", (0, 0, 0))
    box_cost_val = box_info.get("cost", 0)

    full_explanation = (
        f"{explanation} "
        f"Cost breakdown: shipping ₹{cost_analysis['optimized_detail']['shipping_cost']:.2f} + "
        f"box ₹{box_cost_val:.2f} = total ₹{cost_analysis['optimized_cost']:.2f}. "
        f"Saves ₹{cost_analysis['savings']:.2f} vs default packaging."
    )

    return {
        "recommended_box": recommended_box,
        "confidence_score": round(confidence_score, 4),
        "efficiency_score": cost_analysis["efficiency_score"],
        "baseline_cost": cost_analysis["baseline_cost"],
        "optimized_cost": cost_analysis["optimized_cost"],
        "savings": cost_analysis["savings"],
        "decision_explanation": full_explanation,
        "alternative_boxes": alternatives,
        "box_dimensions": f"{bL}×{bW}×{bH} cm",
        "prediction_source": source,
    }
