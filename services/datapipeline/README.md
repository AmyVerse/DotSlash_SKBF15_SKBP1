# ESG Data Cleaning + Prediction Service

This repository provides a combined ESG backend with two major capabilities:

1. Data cleaning for uploaded CSV/XLS/XLSX datasets.
2. Machine learning inference endpoints for scenario and forecast predictions.

It includes both:

- A FastAPI service for production-style API access.
- A Gradio UI for quick manual testing of cleaning and prediction flows.

---

## 1. What This Project Contains

### Core Runtime Components

- `api.py` (root): compatibility entrypoint that exposes the app from `src/api.py`.
- `src/api.py`: FastAPI app, routing, request handling, and response shaping.
- `src/model_loader.py`: model registry and model-loading lifecycle.
- `src/predictor.py`: prediction logic and output normalization.
- `src/schemas.py`: payload validation for prediction requests.
- `src/config.py`: path and service constants.
- `dataclean.py`: data-cleaning logic used by API and Gradio fallback.
- `gradio_app.py`: test UI for cleaning + prediction requests.

### Artifacts and Outputs

- `models/`: expected location of serialized models.
- `cleaned_outputs/`: cleaned CSV outputs written by API cleaning endpoint.

---

## 2. High-Level Architecture

The service starts in `src/api.py`, initializes a `ModelRegistry`, and tries to load all configured models at startup.

Request flow for prediction:

1. Client sends JSON to `/predict/scenario` or `/predict/forecast`.
2. FastAPI validates request body using `FeaturesPayload` (`src/schemas.py`).
3. Endpoint calls prediction helper in `src/predictor.py`.
4. Predictor fetches model instance from `ModelRegistry`.
5. Input features are converted to a one-row pandas DataFrame.
6. Model `.predict()` is executed.
7. Output is converted to JSON-safe values and returned.

Request flow for cleaning:

1. Client uploads file to `/clean/upload`.
2. API stores upload as a temporary file.
3. `clean_file(...)` from `dataclean.py` is called.
4. Cleaned dataframe is saved to `cleaned_outputs/`.
5. API returns report, preview, and a download URL.

---

## 3. Project Structure (Detailed)

```text
.
|-- api.py                     # compatibility app import
|-- gradio_app.py              # manual testing UI
|-- dataclean.py               # cleaning logic
|-- requirements.txt
|-- models/
|   |-- scenario_model.pkl     # currently used scenario model
|   |-- forecast_model.pkl     # optional, may be missing
|-- cleaned_outputs/           # generated cleaned files
|-- src/
|   |-- __init__.py
|   |-- api.py                 # FastAPI endpoints and startup wiring
|   |-- config.py              # paths and service metadata
|   |-- model_loader.py        # model registry + compatibility shim
|   |-- predictor.py           # model inference formatting
|   |-- schemas.py             # Pydantic request schema
|   |-- utils.py               # JSON-safe conversion helper
|-- README.md
```

---

## 4. Configuration and Paths

`src/config.py` defines:

- `SERVICE_NAME`
- `SERVICE_VERSION`
- `BASE_DIR`
- `MODELS_DIR`
- `SCENARIO_MODEL_PATH`
- `FORECAST_MODEL_PATH`
- `OUTPUT_DIR`

Important behavior:

- `OUTPUT_DIR.mkdir(exist_ok=True)` guarantees `cleaned_outputs/` exists at runtime.

---

## 5. Model Loading Lifecycle

`src/model_loader.py` contains `ModelRegistry`, which:

- Stores model file paths.
- Attempts to load all models at startup.
- Tracks loaded models and per-model errors.
- Exposes helper methods used by `/health` and `/meta`.

### Compatibility Handling

`_ensure_sklearn_pickle_compatibility()` injects a compatibility alias for `_RemainderColsList` inside `sklearn.compose._column_transformer` when needed.

Why this exists:

- Older pickled sklearn pipelines can reference internal classes that changed across versions.
- Without this shim, loading can fail before inference starts.

---

## 6. Prediction Contracts

### 6.1 Request Schema

`src/schemas.py` currently accepts:

- `features: Dict[str, Any]`
- Feature values must be scalar (`int`, `float`, `str`, `bool`).

This enables mixed-type inputs (for example categorical string fields like `action_type`).

### 6.2 Scenario Model Input (Current)

The scenario model expects these input feature keys:

- `baseline_emissions_kg`
- `baseline_cost_usd`
- `action_type`
- `swap_tier_level`
- `supplier_cost_delta`
- `supplier_emission_idx_delta`
- `regional_tax_penalty`
- `affected_region_code`
- `predicted_cost_change`
- `predicted_emission_change`

### 6.3 Scenario Response

`src/predictor.py` normalizes scenario model outputs and returns:

```json
{
  "status": "success",
  "predictions": {
    "predicted_cost_change": -70884.91,
    "predicted_emission_change": 469.05,
    "predicted_energy_change": 0.0
  }
}
```

Notes:

- If model output has 2 values, first two fields are populated and `predicted_energy_change` is set to `0.0`.
- If output has 3+ values, the first three are used.

### 6.4 Forecast Response

`/predict/forecast` returns:

```json
{
  "status": "success",
  "prediction": {
    "next_emission": 41.7
  }
}
```

If forecast model file is missing, endpoint returns a graceful error via `PredictionError`.

---

## 7. API Endpoints (Deep Reference)

### `GET /health`

Purpose:

- Liveness-style check.
- Indicates whether at least one model is loaded.

Response shape:

```json
{
  "status": "ok",
  "models_loaded": true
}
```

### `GET /meta`

Purpose:

- Runtime introspection.
- Returns loaded model names and model loading errors.

Response example:

```json
{
  "service": "ESG ML Prediction Service",
  "version": "1.1.0",
  "loaded_models": ["scenario"],
  "model_errors": {
    "forecast": "Model file not found: .../models/forecast_model.pkl"
  }
}
```

### `POST /predict/scenario`

Request body:

```json
{
  "features": {
    "baseline_emissions_kg": 1250,
    "baseline_cost_usd": 82000,
    "action_type": "swap",
    "swap_tier_level": 2,
    "supplier_cost_delta": -1200,
    "supplier_emission_idx_delta": -0.08,
    "regional_tax_penalty": 450,
    "affected_region_code": 3,
    "predicted_cost_change": 0,
    "predicted_emission_change": 0
  }
}
```

### `POST /predict/forecast`

Request body:

```json
{
  "features": {
    "lag_1_emission": 43,
    "lag_2_emission": 45,
    "lag_3_emission": 44,
    "production_next": 150,
    "diesel_next": 30,
    "month": 7
  }
}
```

### `POST /clean/upload`

Form-data fields:

- `file`: CSV/XLS/XLSX upload
- `dataset_type`: optional string, default `generic`

Returns:

- `job_id`
- `output_name`
- row/column info
- preview rows
- cleaning report
- `download_url`

### `GET /clean/download/{job_id}`

Downloads the generated cleaned CSV for an existing job.

---

## 8. Gradio Integration

`gradio_app.py` provides 3 tabs:

1. `Data Cleaning`
2. `Scenario Prediction`
3. `Forecast Prediction`

How it works:

- Cleaning tab calls API `/clean/upload` and then `/clean/download/{job_id}`.
- If API is down during cleaning, it falls back to direct local `clean_file(...)` execution.
- Prediction tabs post JSON directly to API endpoints.

Current scenario default payload in Gradio is aligned to the active model columns.

---

## 9. Installation and Run

### 9.1 Install Dependencies

```bash
pip install -r requirements.txt
```

If your model artifact includes XGBoost estimators and loading fails with `No module named 'xgboost'`, install:

```bash
pip install xgboost
```

### 9.2 Run API

```bash
uvicorn api:app --host 127.0.0.1 --port 8000 --reload
```

### 9.3 Run Gradio

```bash
python gradio_app.py
```

Default Gradio URL: `http://127.0.0.1:7860`

---

## 10. Integration Behavior and Failure Modes

### Model Missing

- Service still starts.
- `/health` remains available.
- `/meta` shows model-specific error.
- Prediction endpoint for missing model returns handled 400 error.

### API Server Not Running

Gradio prediction tabs show:

- `API unavailable: ... Max retries exceeded ...`

Fix:

- Start FastAPI server first.

### Validation Errors (422)

If you see `float_parsing` for `action_type`, it usually means:

- You are hitting an older running server process still using old schema.
- Restart API after schema changes.

### sklearn Version Warnings

Warnings like `InconsistentVersionWarning` indicate model was trained/pickled under a different sklearn version.

- Inference may still work.
- Best long-term fix: retrain/re-export model in the target environment version.

---

## 11. Example cURL Calls

### Scenario Prediction

```bash
curl -X POST "http://127.0.0.1:8000/predict/scenario" \
  -H "Content-Type: application/json" \
  -d '{"features":{"baseline_emissions_kg":1250,"baseline_cost_usd":82000,"action_type":"swap","swap_tier_level":2,"supplier_cost_delta":-1200,"supplier_emission_idx_delta":-0.08,"regional_tax_penalty":450,"affected_region_code":3,"predicted_cost_change":0,"predicted_emission_change":0}}'
```

### Health and Metadata

```bash
curl "http://127.0.0.1:8000/health"
curl "http://127.0.0.1:8000/meta"
```

---

## 12. Development Notes

- Keep model input contracts in sync across:
  - model training artifacts
  - `src/schemas.py`
  - Gradio defaults in `gradio_app.py`
  - this README examples
- Prefer checking `/meta` immediately after startup to verify model state.
- When changing model outputs, update `predict_scenario(...)` output mapping accordingly.

---

## 13. Quick Checklist

Before testing predictions:

1. Confirm API is running on `127.0.0.1:8000`.
2. Confirm `models/scenario_model.pkl` exists.
3. Confirm `/meta` shows scenario model in `loaded_models`.
4. Confirm request contains all required scenario feature keys.
5. Confirm values are scalar types only.

If all five pass, scenario inference should execute successfully.
