"""Marketing ROI Optimizer dashboard, running in the browser with stlite (Streamlit on Pyodide).

Port of Neonexus45/ProjetDEM2 src/dashboard/app.py: same pages, Altair charts instead of Plotly,
local prediction instead of the FastAPI call, exact linear SHAP instead of the shap package.
"""
import altair as alt
import numpy as np
import pandas as pd
import streamlit as st

import model as m
from i18n import NOTEBOOK, T
from settings import ACCENT, LANG

t = T[LANG]
BEST = "font-weight: 700"  # how the best score of each column is marked in tables
st.set_page_config(page_title=t["title"], layout="wide")


def bars(data: pd.DataFrame, x: str, y: str, title: str, error: str | None = None) -> alt.Chart:
    base = alt.Chart(data, title=title)
    chart = base.mark_bar(color=ACCENT, cornerRadiusEnd=4).encode(
        x=alt.X(f"{x}:N", sort=None, title=None, axis=alt.Axis(labelAngle=0)), y=alt.Y(f"{y}:Q", title=None), tooltip=[x, alt.Tooltip(y, format=".4f")])
    if error:
        chart += base.mark_errorbar().encode(x=f"{x}:N", y=f"{y}:Q", yError=f"{error}:Q")
    return chart


def page_kpis():
    df = m.load()
    total = df[m.NUMERICAL].sum(axis=1)
    cols = st.columns(4)
    cols[0].metric(t["avg_budget"], f"{total.mean():.0f}")
    cols[1].metric(t["avg_sales"], f"{df[m.TARGET].mean():.0f}")
    cols[2].metric(t["avg_roi"], f"{((df[m.TARGET] - total) / total * 100).mean():.1f}%")
    cols[3].metric(t["rows"], f"{len(df)}")

    st.subheader(t["roi_channel"])
    for col, channel in zip(st.columns(3), m.NUMERICAL):
        ratio = (df[m.TARGET] / df[channel]).replace([np.inf, -np.inf], np.nan).dropna().mean()
        col.metric(f"{t['yield']} {channel}", f"{ratio:.1f}x")

    st.subheader(t["split"])
    left, right = st.columns(2)
    means = pd.DataFrame({"channel": m.NUMERICAL, "value": df[m.NUMERICAL].mean().values})
    sums = pd.DataFrame({"channel": m.NUMERICAL, "value": df[m.NUMERICAL].sum().values})
    left.altair_chart(bars(means, "channel", "value", t["mean_budget"]), use_container_width=True)
    right.altair_chart(bars(sums, "channel", "value", t["total_budget"]), use_container_width=True)

    st.subheader(t["vs"])
    channel = st.selectbox(t["channel"], m.NUMERICAL)
    base = alt.Chart(df, title=f"{channel} vs Sales ({t['corr']}: {df[channel].corr(df[m.TARGET]):.3f})")
    points = base.mark_circle(size=14, opacity=0.4).encode(
        x=f"{channel}:Q", y=f"{m.TARGET}:Q",
        color=alt.Color("Influencer:N", sort=m.INFLUENCER_ORDER), tooltip=[channel, m.TARGET, "Influencer"])
    trend = base.transform_regression(channel, m.TARGET).mark_line(color=ACCENT, strokeWidth=2).encode(
        x=f"{channel}:Q", y=f"{m.TARGET}:Q")
    st.altair_chart(points + trend, use_container_width=True)


def page_comparison():
    with st.spinner(t["training"]):
        results = m.compare()
    best = results["CV_R2_mean"].idxmax()
    st.success(t["best"].format(name=best, score=results.loc[best, "CV_R2_mean"]))

    st.subheader(t["table"])
    st.dataframe(results.style.format("{:.4f}").highlight_max(subset=["R2", "CV_R2_mean"], props=BEST)
                 .highlight_min(subset=["MAE", "RMSE", "MAPE"], props=BEST), use_container_width=True)
    st.caption(t["notebook"])
    st.dataframe(pd.DataFrame(NOTEBOOK).T, use_container_width=True)

    data = results.reset_index(names="model")
    left, right = st.columns(2)
    left.altair_chart(bars(data, "model", "CV_R2_mean", t["cv_r2"], "CV_R2_std"), use_container_width=True)
    right.altair_chart(bars(data, "model", "MAE", t["mae"]), use_container_width=True)

    st.subheader(t["residuals"])
    _, X_test, _, y_test = m.split(m.load())
    pred = m.fitted(best).predict(X_test)
    res = pd.DataFrame({"pred": pred, "res": y_test.values - pred})
    left, right = st.columns(2)
    scatter = alt.Chart(res).mark_circle(size=14, opacity=0.4, color=ACCENT).encode(
        x=alt.X("pred:Q", title=t["predicted"]), y=alt.Y("res:Q", title=t["residual"]))
    zero = alt.Chart(pd.DataFrame({"y": [0]})).mark_rule(strokeDash=[4, 4]).encode(y="y:Q")
    left.altair_chart(scatter + zero, use_container_width=True)
    right.altair_chart(alt.Chart(res).mark_bar(color=ACCENT).encode(
        x=alt.X("res:Q", bin=alt.Bin(maxbins=30), title=t["residual"]), y=alt.Y("count():Q", title=t["count"])),
        use_container_width=True)
    st.caption(t["res_stats"].format(m=res["res"].mean(), s=res["res"].std()))


def page_classification():
    st.markdown(t["clf_intro"])
    with st.spinner(t["training"]):
        table, best, cm = m.classification()
    st.success(t["clf_best"].format(name=best, score=table.loc[best, "CV_F1_mean"]))
    st.dataframe(table.style.format("{:.4f}").highlight_max(subset=["Accuracy", "F1", "CV_F1_mean"], props=BEST),
                 use_container_width=True)
    left, right = st.columns(2)
    data = table.reset_index(names="model")
    left.altair_chart(bars(data, "model", "CV_F1_mean", t["cv_f1"], "CV_F1_std"), use_container_width=True)
    cells = pd.DataFrame([(a, p, int(cm[i, j])) for i, a in enumerate(m.CLASSES) for j, p in enumerate(m.CLASSES)],
                         columns=["actual", "predicted", "n"])
    heat = alt.Chart(cells, title=t["cm"].format(name=best)).encode(
        x=alt.X("predicted:N", sort=m.CLASSES, title=t["predicted"]), y=alt.Y("actual:N", sort=m.CLASSES, title=t["actual"]))
    right.altair_chart(heat.mark_rect().encode(color=alt.Color("n:Q", legend=None, scale=alt.Scale(scheme="oranges")))
                       + heat.mark_text().encode(text="n:Q"), use_container_width=True)


def page_simulator():
    st.caption(t["sim_intro"])
    left, right = st.columns(2)
    tv = left.slider("Budget TV", 0, 300, 50)
    radio = left.slider("Budget Radio", 0, 100, 20)
    social = left.slider("Budget Social Media", 0, 100, 10)
    influencer = right.selectbox(t["influencer"], m.INFLUENCER_ORDER)
    row = pd.DataFrame([{"TV": tv, "Radio": radio, "Social_Media": social, "Influencer": influencer}])
    sales = float(m.fitted("LinearRegression").predict(row)[0])
    budget = tv + radio + social
    roi = (sales - budget) / budget * 100 if budget > 0 else 0.0
    cols = right.columns(3)
    cols[0].metric(t["pred_sales"], f"{sales:.2f}")
    cols[1].metric(t["est_roi"], f"{roi:.1f}%")
    cols[2].metric(t["total_budget"], f"{budget}")


def page_explainability():
    st.caption(t["shap_intro"])
    df = m.load()
    X_train, X_test, _, _ = m.split(df)
    pipe = m.fitted("LinearRegression")
    shap = m.linear_shap(pipe, X_test, X_train)
    order = shap.abs().mean().sort_values(ascending=False).index.tolist()
    importance = pd.DataFrame({"feature": order, "value": shap.abs().mean()[order].values})
    st.altair_chart(bars(importance, "feature", "value", t["mean_abs"]), use_container_width=True)
    scaled = pd.DataFrame(pipe.named_steps["preprocessor"].transform(X_test), columns=m.FEATURES, index=X_test.index)
    long = shap.melt(ignore_index=False, var_name="feature", value_name="shap").reset_index()
    long["value"] = scaled.melt(ignore_index=False)["value"].values
    st.altair_chart(alt.Chart(long, title=t["impact"]).mark_circle(size=12, opacity=0.5).encode(
        x=alt.X("shap:Q", title=t["impact"]), y=alt.Y("feature:N", sort=order, title=None),
        yOffset=alt.YOffset("jitter:Q"), color=alt.Color("value:Q", title=t["value"], scale=alt.Scale(scheme="blueorange")),
    ).transform_calculate(jitter="random()"), use_container_width=True)


st.title(t["title"])
pages = dict(zip(t["pages"], [page_kpis, page_comparison, page_classification, page_simulator, page_explainability]))
pages[st.sidebar.radio(t["nav"], list(pages))]()
