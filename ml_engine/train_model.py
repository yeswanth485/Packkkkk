"""
ML Training Pipeline for AI Packaging Automation Platform.
Trains a RandomForestClassifier to predict box type from product dimensions.
"""
import os
import sys
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, accuracy_score
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from ml_engine.dataset_loader import load_dataset, generate_synthetic_dataset

MODEL_OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "packaging_model.pkl")
DATASET_PATH = os.path.join(os.path.dirname(__file__), "packaging_dataset.csv")

FEATURE_COLUMNS = ["length", "width", "height", "weight", "volume", "dim_weight", "chargeable_weight"]
TARGET_COLUMN = "box_type"

def train():
    # 1. Load dataset
    if os.path.exists(DATASET_PATH):
        logger.info(f"Loading dataset from {DATASET_PATH}")
        df = load_dataset(DATASET_PATH)
    else:
        logger.warning("No dataset found. Generating synthetic training data...")
        df = generate_synthetic_dataset(n_samples=3000)
        df["volume"] = df["length"] * df["width"] * df["height"]
        df["dim_weight"] = df["volume"] / 5000.0
        df["chargeable_weight"] = df[["weight", "dim_weight"]].max(axis=1)

    logger.info(f"Training samples: {len(df)} | Classes: {df[TARGET_COLUMN].nunique()}")
    logger.info(f"Class distribution:\n{df[TARGET_COLUMN].value_counts()}")

    # 2. Prepare features
    X = df[FEATURE_COLUMNS].values
    y = df[TARGET_COLUMN].values

    # 3. Split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    # 4. Train
    logger.info("Training RandomForestClassifier...")
    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=15,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1,
        class_weight="balanced",
    )
    model.fit(X_train, y_train)

    # 5. Evaluate
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    logger.info(f"Test Accuracy: {accuracy:.4f} ({accuracy*100:.1f}%)")
    logger.info(f"\nClassification Report:\n{classification_report(y_test, y_pred)}")

    # Feature importance
    importances = dict(zip(FEATURE_COLUMNS, model.feature_importances_))
    logger.info(f"Feature importances: {importances}")

    # 6. Save model bundle
    model_bundle = {
        "model": model,
        "feature_columns": FEATURE_COLUMNS,
        "classes": list(model.classes_),
        "accuracy": accuracy,
        "version": "1.0.0",
    }
    joblib.dump(model_bundle, MODEL_OUTPUT_PATH)
    logger.info(f"Model saved to {MODEL_OUTPUT_PATH}")
    return model_bundle

if __name__ == "__main__":
    train()
