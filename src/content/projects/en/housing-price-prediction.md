---
title: "Housing Price Prediction Pipeline"
summary: "Batch and simulated streaming property data through a Spark medallion pipeline into MySQL datamarts, a price model and a map dashboard."
date: 2025-05-01
stack: [Python, PySpark, Parquet, MySQL, scikit-learn, Streamlit, Plotly, Folium]
repo: https://github.com/Neonexus45/data_integration_projet
# TODO Elliot: team members and your role
architecture: |
  flowchart LR
    subgraph src["Sources"]
      batch(["Historical sales CSV"])
      gen@{ icon: "logos:python", label: "Stream generator · 1 row / 5 s", pos: "b", h: 44 }
    end
    subgraph lake["Spark medallion · Parquet"]
      raw@{ icon: "logos:apache-spark", label: "Raw → Bronze", pos: "b", h: 44 }
      silver@{ icon: "logos:apache-spark", label: "Silver", pos: "b", h: 44 }
      gold@{ icon: "logos:apache-spark", label: "Gold", pos: "b", h: 44 }
    end
    db@{ icon: "logos:mysql-icon", label: "3 MySQL datamarts", pos: "b", h: 44 }
    ml(["scikit-learn<br/>price model"])
    st@{ icon: "logos:streamlit", label: "Streamlit · Plotly · Folium", pos: "b", h: 44 }
    src --> raw --> silver --> gold --> db --> st
    gold --> ml --> db
dashboard:
  charts:
    - title: "R² on the test set by model (higher is better)"
      max: 1
      bars:
        - { label: Linear regression, value: 0.910 }
        - { label: Gradient boosting, value: 0.861 }
        - { label: Random forest, value: 0.815 }
  shots:
    - src: projects/housing-price-prediction/predictions_vs_actual.png
      alt: "Scatter plot of predicted against actual sale prices for the linear regression model."
      caption: "Predicted vs actual price (linear regression)."
    - src: projects/housing-price-prediction/feature_importance.png
      alt: "Bar chart of the 10 most important features; transaction date, property type and zoning code lead."
      caption: "Top 10 features by relative importance."
---

## Problem

Predict property sale prices from a pipeline that handles both historical batch files and a live feed of new
listings, and give analysts price trends by region and the factors that drive price.

## Data sources

- **Batch:** a CSV of historical property sales (lot, zoning, building and sale attributes).
- **Stream:** a Python generator that emits a new property every 5 seconds, standing in for a Kafka feed.

## Data model

Raw and Bronze layers in Parquet partitioned by `year/month/day`; Silver splits records into property details,
location, building features and sale history; Gold computes price trends, moving averages, seasonal variations,
market indicators and model features. An ETL step loads three MySQL datamarts: price trends by region, feature
impact, and predictions.

## Decisions and tradeoffs

- **Linear regression kept** after comparing it with random forest and gradient boosting: best test R² (0.910,
  RMSE ≈ 120k, MAE ≈ 53k).
- **Date partitioning everywhere**, so batch and stream data land in the same layout and can be reprocessed by day.
- **Streaming simulated** with a generator rather than a running Kafka cluster.
