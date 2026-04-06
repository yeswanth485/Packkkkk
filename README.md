# PackAI — AI Packaging Automation Platform

> Reduce packaging & shipping costs by **15–30%** with a real-time AI optimization engine.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Next.js 14 Frontend (TypeScript + TailwindCSS)         │
│  Landing Page · Login · Dashboard · Analytics           │
└────────────────────────┬────────────────────────────────┘
                         │ REST + WebSocket
┌────────────────────────▼────────────────────────────────┐
│  FastAPI Backend (Python 3.11)                          │
│  JWT Auth · Orders API · Prediction API · WebSocket     │
│                                                         │
│  ┌──────────────┐  ┌────────────────┐                   │
│  │ Cost Engine  │  │ Prediction Svc │                   │
│  │ Baseline vs  │  │ Rule-based     │                   │
│  │ Optimized    │  │ + ML fallback  │                   │
│  └──────────────┘  └────────────────┘                   │
└────────────────────────┬────────────────────────────────┘
                         │ SQLAlchemy ORM
┌────────────────────────▼────────────────────────────────┐
│  PostgreSQL Database                                    │
│  users · orders · packaging_results                     │
└─────────────────────────────────────────────────────────┘
```

---

## Quick Start (Docker)

```bash
git clone <repo>
cd ai-packaging-platform
docker-compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## Quick Start (Local Dev)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Train ML model first
python ml_engine/train_model.py

# Set env vars
export DATABASE_URL="postgresql+asyncpg://postgres:password@localhost:5432/packaging_db"
export SECRET_KEY="your-secret-key"

# Run server
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev
```

---

## CSV Upload Format

```csv
product_name,length,width,height,weight,quantity
Wireless Headphones,28,18,12,0.8,1
Running Shoes,32,22,14,1.2,2
Laptop Sleeve,38,28,4,0.5,1
```

---

## API Endpoints

| Method | Endpoint              | Description                        |
|--------|-----------------------|------------------------------------|
| GET    | /health               | Health check                       |
| POST   | /auth/register        | Register user → returns JWT        |
| POST   | /auth/login           | Login → returns JWT                |
| POST   | /orders               | Create order + auto-optimize       |
| GET    | /orders               | List all orders with results       |
| POST   | /orders/upload-csv    | Bulk upload & optimize             |
| GET    | /orders/analytics     | Aggregated analytics               |
| POST   | /predict-packaging    | Run prediction manually            |
| WS     | /ws/{token}           | Real-time WebSocket updates        |

---

## Cost Calculation Logic

```
baseline_dim_weight       = (L × W × H) / 5000
baseline_chargeable_weight = max(actual_weight, baseline_dim_weight)
baseline_shipping_cost    = ₹45 × chargeable_weight
baseline_total_cost       = shipping_cost + box_cost (default Box_XL)

optimized uses recommended_box instead of default
savings = baseline_total_cost - optimized_total_cost
```

---

## Box Catalog

| Box    | Dimensions (cm) | Cost (₹) |
|--------|-----------------|----------|
| Box_XS | 15×12×10        | ₹8       |
| Box_S  | 25×20×15        | ₹12      |
| Box_M  | 35×30×25        | ₹18      |
| Box_L  | 50×40×35        | ₹25      |
| Box_XL | 65×55×45        | ₹35      |
| Box_XXL| 80×70×60        | ₹50      |

---

## ML Engine

- Algorithm: `RandomForestClassifier` (200 trees)
- Features: length, width, height, weight, volume, dim_weight, chargeable_weight
- Primary: **Rule-based** (finds smallest fitting box with 5% packing allowance)
- ML: **Fallback only** — used when rule-based is uncertain or ML confidence > 95%
- Training: Synthetic data generated if no CSV provided → run `python ml_engine/train_model.py`

---

## n8n Automation (Prompt 5)

Import `n8n_workflow.json` into your n8n instance.

Set environment variables in n8n:
- `API_URL` → `http://backend:8000`
- `DASHBOARD_WEBHOOK_URL` → your webhook URL

---

## Environment Variables

### Backend `.env`
```
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/packaging_db
SECRET_KEY=your-secret-key-min-32-chars
ML_MODEL_PATH=ml_engine/packaging_model.pkl
SHIPPING_RATE_PER_KG=45.0
```

### Frontend `.env.local`
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```
