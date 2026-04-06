#!/usr/bin/env bash
# Render build script for PackAI Backend
set -o errexit   # exit on error

echo "=========================================="
echo " PackAI Backend - Render Build Script"
echo "=========================================="

# Install Python dependencies
echo "[1/3] Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Fix asyncpg DATABASE_URL (Render gives postgres://, asyncpg needs postgresql+asyncpg://)
echo "[2/3] Patching DATABASE_URL for asyncpg..."
# This is handled in config.py automatically

# Train ML model
echo "[3/3] Training ML model..."
python ml_engine/train_model.py

echo ""
echo "Build complete. Model saved at ml_engine/packaging_model.pkl"
echo "=========================================="
