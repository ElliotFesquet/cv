---
title: "US Accidents Lakehouse"
summary: "A Spark lakehouse on US road accident data: weather impact analysis, severity prediction, an API and a dashboard."
date: 2025-06-01
stack: [Python, PySpark, Parquet, MySQL, scikit-learn, FastAPI, Streamlit, Docker]
repo: https://github.com/Neonexus45/tp-bigdata
# TODO Elliot: team members and your role
architecture: |
  flowchart LR
    csv(["US Accidents CSV"])
    subgraph lake["Lakehouse · Docker Compose"]
      bronze@{ icon: "logos:apache-spark", label: "Feeder · Bronze Parquet", pos: "b", h: 44 }
      silver@{ icon: "logos:apache-spark", label: "Preprocessor · Silver", pos: "b", h: 44 }
      gold@{ icon: "logos:apache-spark", label: "Datamart · weather analyses", pos: "b", h: 44 }
    end
    ml(["scikit-learn<br/>severity model"])
    db@{ icon: "logos:mysql-icon", label: "MySQL", pos: "b", h: 44 }
    api@{ icon: "logos:fastapi-icon", label: "FastAPI", pos: "b", h: 44 }
    st@{ icon: "logos:streamlit", label: "Streamlit", pos: "b", h: 44 }
    dk@{ icon: "logos:docker-icon", label: "Docker", pos: "b", h: 44 }
    csv --> bronze --> silver --> gold --> db
    silver --> ml --> db
    db --> api & st
    dk -.- lake
---

## Problem

Build a layered lakehouse on US road accident data to measure how weather conditions relate to how often accidents
happen and how severe they are, and predict accident severity.

## Data sources

The US Accidents dataset, loaded as CSV.

<!-- TODO Elliot: dataset version and volume (rows, years covered) -->

## Data model

- **Bronze (feeder):** raw CSV to Parquet, partitioned by date, basic validation.
- **Silver (preprocessor):** missing values handled, formats standardised, split into thematic datasets.
- **Gold (datamart):** weather/frequency, weather/severity and trend tables written to MySQL, plus ML feature tables
  and stored models.

## Decisions and tradeoffs

- **Spark DataFrames end to end:** pandas was removed from the pipeline in version 2 for performance.
- **Shared core classes** (`Config`, `Logger` with rotating files, singleton `SparkManager`) reused by every job.
- **Dockerised jobs** (`docker-compose`) with one script per layer, so each layer can be rerun alone.
