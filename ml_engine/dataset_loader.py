import pandas as pd
import numpy as np
import logging

logger = logging.getLogger(__name__)

REQUIRED_COLUMNS = {"length", "width", "height", "weight", "box_type"}

def load_dataset(filepath: str) -> pd.DataFrame:
    """Load and validate packaging dataset from CSV."""
    df = pd.read_csv(filepath)
    missing = REQUIRED_COLUMNS - set(df.columns)
    if missing:
        raise ValueError(f"Missing required columns: {missing}")

    initial_count = len(df)
    df = df.dropna(subset=list(REQUIRED_COLUMNS))
    df = df[(df["length"] > 0) & (df["width"] > 0) & (df["height"] > 0) & (df["weight"] > 0)]
    df["volume"] = df["length"] * df["width"] * df["height"]
    df["dim_weight"] = df["volume"] / 5000.0
    df["chargeable_weight"] = df[["weight", "dim_weight"]].max(axis=1)

    logger.info(f"Dataset loaded: {len(df)}/{initial_count} valid rows")
    return df

def generate_synthetic_dataset(n_samples: int = 2000) -> pd.DataFrame:
    """Generate a synthetic dataset for training when no real data is available."""
    np.random.seed(42)

    box_rules = {
        "Box_XS": (15, 12, 10),
        "Box_S":  (25, 20, 15),
        "Box_M":  (35, 30, 25),
        "Box_L":  (50, 40, 35),
        "Box_XL": (65, 55, 45),
        "Box_XXL":(80, 70, 60),
    }

    records = []
    for _ in range(n_samples):
        box = np.random.choice(list(box_rules.keys()))
        bL, bW, bH = box_rules[box]
        # Product slightly smaller than box (60-95% of box size)
        scale = np.random.uniform(0.6, 0.95)
        L = round(bL * scale * np.random.uniform(0.8, 1.0), 1)
        W = round(bW * scale * np.random.uniform(0.8, 1.0), 1)
        H = round(bH * scale * np.random.uniform(0.8, 1.0), 1)
        weight = round(np.random.uniform(0.2, 15.0), 2)
        records.append({"length": L, "width": W, "height": H, "weight": weight, "box_type": box})

    df = pd.DataFrame(records)
    logger.info(f"Generated synthetic dataset: {len(df)} samples")
    return df
