---
title: "Marketing ROI Optimizer"
summary: "Predicting sales from multichannel ad budgets (TV, radio, social, influencers) to guide budget allocation."
date: 2026-05-01
stack: [Python, pandas, scikit-learn, XGBoost, Keras, SHAP, FastAPI, Streamlit, React, pytest]
repo: https://github.com/Neonexus45/ProjetDEM2
team: [Elliot Fesquet, Ethan Tomaso]
role: "Data pipeline, exploratory analysis, Streamlit dashboard"
architecture: |
  flowchart LR
    csv(["Kaggle CSV<br/>4,572 rows"])
    subgraph prep["Preprocessing"]
      pd@{ icon: "logos:pandas-icon", label: "pandas", pos: "b", h: 44 }
      sk(["scikit-learn<br/>Pipeline"])
    end
    subgraph model["Modelling"]
      lr(["Linear regression (chosen)"])
      xgb(["XGBoost · Random forest"])
      keras@{ icon: "logos:tensorflow", label: "Keras MLP", pos: "b", h: 44 }
    end
    shap@{ icon: "logos:python", label: "SHAP", pos: "b", h: 44 }
    api@{ icon: "logos:fastapi-icon", label: "FastAPI /predict", pos: "b", h: 44 }
    subgraph dash["Dashboard"]
      st@{ icon: "logos:streamlit", label: "Streamlit", pos: "b", h: 44 }
      re@{ icon: "logos:react", label: "React", pos: "b", h: 44 }
    end
    csv --> pd --> sk --> model
    model --> shap
    model -- joblib --> api --> st & re
dashboard:
  app: projects/marketing-roi-optimizer/dashboard/
  charts:
    - title: "Test-set MAE by model (lower is better; R² ≈ 0.999 for all three)"
      bars:
        - { label: Linear regression, value: 2.31 }
        - { label: XGBoost, value: 2.60 }
        - { label: Random forest, value: 2.73 }
---

## Problem

Given a combination of marketing budgets (TV, radio, social media) and an influencer tier, predict the sales they
generate and estimate the return on investment. A secondary task classifies campaigns as low, medium or high
performers, using the 33% and 66% sales quantiles as thresholds. The goal is a decision-support tool for allocating budget.

## Data sources

Kaggle's *Dummy Advertising and Sales Data*: 4,572 rows with the budgets `TV`, `Radio`, `Social_Media`, the
`Influencer` tier (Nano, Micro, Macro, Mega) and the target `Sales`. The 26 missing values (0.11%) were dropped.

## Data model

Three numeric features scaled with `StandardScaler`, one ordinal feature (Nano < Micro < Macro < Mega) encoded with
`OrdinalEncoder`, all inside a single `sklearn` `Pipeline` + `ColumnTransformer`. 80/20 train/test split (seed 42).
The best model is saved with `joblib` and loaded by the API.

## Decisions and tradeoffs

- **Linear regression over boosting.** It had the best cross-validated R² (0.9990), the lowest MAE (2.31) and is the
  easiest to explain. The budget-to-sales relationship is close to linear, so tree ensembles and the MLP added nothing.
- **Preprocessing inside the pipeline** so the scaler is fitted on the training fold only.
- **API behind the dashboard.** The Streamlit app calls the FastAPI service, which can also be used by other clients.
