"""Data, preprocessing and models of the DEM2 dashboard (ported from Neonexus45/ProjetDEM2 src/).

Same preprocessing, split (80/20, seed 42), metrics and 5-fold CV as the repo. XGBoost and the Keras MLPs
cannot run in the browser (Pyodide), so they are not retrained here.
"""
import sys

import numpy as np
import pandas as pd
import streamlit as st

# stlite installs a stub `pyarrow`; scikit-learn's isinstance checks need these names to exist.
_pa = sys.modules.get("pyarrow")
if _pa is not None:
    for _name in ("Table", "RecordBatch", "Array", "ChunkedArray"):
        if not hasattr(_pa, _name):
            setattr(_pa, _name, type(_name, (), {}))

from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.metrics import (accuracy_score, confusion_matrix, f1_score, mean_absolute_error,
                             mean_squared_error, precision_score, r2_score, recall_score)
from sklearn.model_selection import cross_val_score, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import LabelEncoder, OrdinalEncoder, StandardScaler

INFLUENCER_ORDER = ["Nano", "Micro", "Macro", "Mega"]
NUMERICAL = ["TV", "Radio", "Social_Media"]
CATEGORICAL = ["Influencer"]
FEATURES = NUMERICAL + CATEGORICAL
TARGET = "Sales"
CLASSES = ["Low", "Medium", "High"]

REGRESSORS = {
    "LinearRegression": lambda: LinearRegression(),
    "RandomForest": lambda: RandomForestRegressor(n_estimators=100, random_state=42),
}
CLASSIFIERS = {
    "LogisticRegression": lambda: LogisticRegression(max_iter=1000, random_state=42),
    "RandomForest_clf": lambda: RandomForestClassifier(n_estimators=100, random_state=42),
}


@st.cache_data
def load() -> pd.DataFrame:
    return pd.read_csv("marketing_and_sales.csv").dropna()


def pipeline(model) -> Pipeline:
    pre = ColumnTransformer([
        ("num", StandardScaler(), NUMERICAL),
        ("cat", OrdinalEncoder(categories=[INFLUENCER_ORDER]), CATEGORICAL),
    ])
    return Pipeline([("preprocessor", pre), ("model", model)])


def split(df: pd.DataFrame):
    return train_test_split(df[FEATURES], df[TARGET], test_size=0.2, random_state=42)


def metrics(y_true, y_pred) -> dict:
    return {
        "MAE": mean_absolute_error(y_true, y_pred),
        "RMSE": float(np.sqrt(mean_squared_error(y_true, y_pred))),
        "R2": r2_score(y_true, y_pred),
        "MAPE": float(np.mean(np.abs((y_true - y_pred) / y_true)) * 100),
    }


@st.cache_data
def compare() -> pd.DataFrame:
    X_train, X_test, y_train, y_test = split(load())
    rows = {}
    for name, make in REGRESSORS.items():
        pipe = pipeline(make()).fit(X_train, y_train)
        row = metrics(y_test.values, pipe.predict(X_test))
        cv = cross_val_score(pipeline(make()), X_train, y_train, cv=5, scoring="r2")
        row["CV_R2_mean"], row["CV_R2_std"] = cv.mean(), cv.std()
        rows[name] = row
    return pd.DataFrame(rows).T


@st.cache_resource
def fitted(name: str) -> Pipeline:
    X_train, _, y_train, _ = split(load())
    return pipeline(REGRESSORS[name]()).fit(X_train, y_train)


def labels(sales: pd.Series) -> pd.Series:
    low, high = sales.quantile(0.33), sales.quantile(0.66)
    out = pd.Series("Medium", index=sales.index)
    out[sales <= low] = "Low"
    out[sales >= high] = "High"
    return out


@st.cache_data
def classification():
    df = load()
    enc = LabelEncoder()
    y = enc.fit_transform(labels(df[TARGET]))
    X_train, X_test, y_train, y_test = train_test_split(
        df[FEATURES], y, test_size=0.2, random_state=42, stratify=y)
    rows, preds = {}, {}
    for name, make in CLASSIFIERS.items():
        pred = enc.inverse_transform(pipeline(make()).fit(X_train, y_train).predict(X_test))
        true = enc.inverse_transform(y_test)
        cv = cross_val_score(pipeline(make()), X_train, y_train, cv=5, scoring="f1_weighted")
        rows[name] = {
            "Accuracy": accuracy_score(true, pred),
            "Precision": precision_score(true, pred, average="weighted", zero_division=0),
            "Recall": recall_score(true, pred, average="weighted", zero_division=0),
            "F1": f1_score(true, pred, average="weighted", zero_division=0),
            "CV_F1_mean": cv.mean(), "CV_F1_std": cv.std(),
        }
        preds[name] = (true, pred)
    table = pd.DataFrame(rows).T
    best = table["CV_F1_mean"].idxmax()
    cm = confusion_matrix(*preds[best], labels=CLASSES)
    return table, best, cm


def linear_shap(pipe: Pipeline, X: pd.DataFrame, background: pd.DataFrame) -> pd.DataFrame:
    """Exact SHAP values of a linear model: coef * (x - mean of the background), per feature."""
    pre, model = pipe.named_steps["preprocessor"], pipe.named_steps["model"]
    z, z_bg = pre.transform(X), pre.transform(background)
    return pd.DataFrame((z - z_bg.mean(axis=0)) * model.coef_, columns=FEATURES, index=X.index)
