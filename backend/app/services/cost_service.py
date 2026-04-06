"""
Cost Calculation Engine for AI Packaging Automation Platform
Computes baseline cost, optimized cost, and savings per order.
"""
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# Box catalog: name -> (L, W, H in cm, box_cost in ₹)
BOX_CATALOG = {
    "Box_XS": {"dims": (15, 12, 10), "cost": 8.0,  "label": "Extra Small"},
    "Box_S":  {"dims": (25, 20, 15), "cost": 12.0, "label": "Small"},
    "Box_M":  {"dims": (35, 30, 25), "cost": 18.0, "label": "Medium"},
    "Box_L":  {"dims": (50, 40, 35), "cost": 25.0, "label": "Large"},
    "Box_XL": {"dims": (65, 55, 45), "cost": 35.0, "label": "Extra Large"},
    "Box_XXL":{"dims": (80, 70, 60), "cost": 50.0, "label": "Double XL"},
}

DEFAULT_BOX = "Box_XL"  # Largest standard box used as baseline


def _dim_weight(L: float, W: float, H: float) -> float:
    """Calculate dimensional weight."""
    return (L * W * H) / settings.DIM_WEIGHT_DIVISOR


def _chargeable_weight(actual_weight: float, dim_weight: float) -> float:
    """Return the higher of actual vs dimensional weight."""
    return max(actual_weight, dim_weight)


def _shipping_cost(chargeable_weight: float) -> float:
    """Calculate shipping cost based on chargeable weight."""
    return round(settings.SHIPPING_RATE_PER_KG * chargeable_weight, 2)


def _box_volume(box_name: str) -> float:
    """Return volume of a box in cm³."""
    if box_name not in BOX_CATALOG:
        return 1.0
    L, W, H = BOX_CATALOG[box_name]["dims"]
    return float(L * W * H)


def _box_cost(box_name: str) -> float:
    if box_name not in BOX_CATALOG:
        return 18.0
    return BOX_CATALOG[box_name]["cost"]


def calculate_baseline_cost(length: float, width: float, height: float, weight: float) -> dict:
    """
    Calculate the baseline packaging cost using the default (largest) box.
    """
    box = DEFAULT_BOX
    dim_w = _dim_weight(length, width, height)
    chargeable_w = _chargeable_weight(weight, dim_w)
    ship_cost = _shipping_cost(chargeable_w)
    box_c = _box_cost(box)
    total = round(ship_cost + box_c, 2)

    return {
        "box": box,
        "dim_weight": round(dim_w, 4),
        "chargeable_weight": round(chargeable_w, 4),
        "shipping_cost": ship_cost,
        "box_cost": box_c,
        "total_cost": total,
    }


def calculate_optimized_cost(length: float, width: float, height: float, weight: float, recommended_box: str) -> dict:
    """
    Calculate the optimized packaging cost using the recommended box.
    """
    dim_w = _dim_weight(length, width, height)
    chargeable_w = _chargeable_weight(weight, dim_w)
    ship_cost = _shipping_cost(chargeable_w)
    box_c = _box_cost(recommended_box)
    total = round(ship_cost + box_c, 2)

    return {
        "box": recommended_box,
        "dim_weight": round(dim_w, 4),
        "chargeable_weight": round(chargeable_w, 4),
        "shipping_cost": ship_cost,
        "box_cost": box_c,
        "total_cost": total,
    }


def calculate_savings(baseline_total: float, optimized_total: float) -> float:
    """Savings must not be negative (edge case: optimized is worse)."""
    savings = baseline_total - optimized_total
    return round(max(savings, 0.0), 2)


def calculate_efficiency_score(product_vol: float, box_name: str) -> float:
    """Calculate how efficiently the product fills the box (0–1)."""
    box_vol = _box_volume(box_name)
    if box_vol <= 0:
        return 0.0
    efficiency = product_vol / box_vol
    return round(min(efficiency, 1.0), 4)


def get_alternative_boxes(length: float, width: float, height: float, weight: float, primary_box: str) -> list:
    """Return cost info for alternative boxes excluding the recommended one."""
    alternatives = []
    for box_name, info in BOX_CATALOG.items():
        if box_name == primary_box:
            continue
        bL, bW, bH = info["dims"]
        if bL >= length and bW >= width and bH >= height:
            opt = calculate_optimized_cost(length, width, height, weight, box_name)
            product_vol = length * width * height
            eff = calculate_efficiency_score(product_vol, box_name)
            alternatives.append({
                "box_type": box_name,
                "dimensions": f"{bL}×{bW}×{bH} cm",
                "cost": opt["total_cost"],
                "efficiency": eff,
            })
    return alternatives[:3]


def full_cost_analysis(length: float, width: float, height: float, weight: float, recommended_box: str) -> dict:
    """
    Run full cost analysis: baseline, optimized, savings, alternatives.
    Validates no negative values are produced.
    """
    baseline = calculate_baseline_cost(length, width, height, weight)
    optimized = calculate_optimized_cost(length, width, height, weight, recommended_box)
    savings = calculate_savings(baseline["total_cost"], optimized["total_cost"])
    product_vol = length * width * height
    efficiency = calculate_efficiency_score(product_vol, recommended_box)
    alternatives = get_alternative_boxes(length, width, height, weight, recommended_box)

    # Validate no negative values
    assert baseline["total_cost"] >= 0, "Baseline cost cannot be negative"
    assert optimized["total_cost"] >= 0, "Optimized cost cannot be negative"
    assert savings >= 0, "Savings cannot be negative"

    logger.info(
        f"Cost analysis: baseline=₹{baseline['total_cost']} "
        f"optimized=₹{optimized['total_cost']} savings=₹{savings}"
    )

    return {
        "baseline_cost": baseline["total_cost"],
        "optimized_cost": optimized["total_cost"],
        "savings": savings,
        "efficiency_score": efficiency,
        "baseline_detail": baseline,
        "optimized_detail": optimized,
        "alternatives": alternatives,
    }


# Unit test examples
if __name__ == "__main__":
    result = full_cost_analysis(30, 20, 15, 2.5, "Box_S")
    print("Test 1:", result)

    result2 = full_cost_analysis(10, 8, 6, 0.5, "Box_XS")
    print("Test 2:", result2)

    result3 = full_cost_analysis(60, 50, 40, 10.0, "Box_XL")
    print("Test 3:", result3)
