---
title: "Pipeline de prédiction des prix immobiliers"
summary: "Des données immobilières batch et en flux simulé, traitées par un pipeline médaillon Spark jusqu'à des datamarts MySQL, un modèle de prix et un dashboard cartographique."
date: 2025-05-01
stack: [Python, PySpark, Parquet, MySQL, scikit-learn, Streamlit, Plotly, Folium]
repo: https://github.com/Neonexus45/data_integration_projet
# TODO Elliot : membres de l'équipe et ton rôle
architecture: |
  flowchart LR
    subgraph src["Sources"]
      batch(["CSV ventes historiques"])
      gen@{ icon: "logos:python", label: "Générateur de flux · 1 ligne / 5 s", pos: "b", h: 44 }
    end
    subgraph lake["Médaillon Spark · Parquet"]
      raw@{ icon: "logos:apache-spark", label: "Raw → Bronze", pos: "b", h: 44 }
      silver@{ icon: "logos:apache-spark", label: "Silver", pos: "b", h: 44 }
      gold@{ icon: "logos:apache-spark", label: "Gold", pos: "b", h: 44 }
    end
    db@{ icon: "logos:mysql-icon", label: "3 datamarts MySQL", pos: "b", h: 44 }
    ml(["scikit-learn<br/>modèle de prix"])
    st@{ icon: "logos:streamlit", label: "Streamlit · Plotly · Folium", pos: "b", h: 44 }
    src --> raw --> silver --> gold --> db --> st
    gold --> ml --> db
dashboard:
  charts:
    - title: "R² sur le jeu de test par modèle (plus haut = mieux)"
      max: 1
      bars:
        - { label: Régression linéaire, value: 0.910 }
        - { label: Gradient boosting, value: 0.861 }
        - { label: Random forest, value: 0.815 }
  shots:
    - src: projects/housing-price-prediction/predictions_vs_actual.png
      alt: "Nuage de points des prix prédits contre les prix réels pour la régression linéaire."
      caption: "Prix prédit vs prix réel (régression linéaire)."
    - src: projects/housing-price-prediction/feature_importance.png
      alt: "Barres des 10 variables les plus importantes ; date de transaction, type de bien et zonage en tête."
      caption: "Top 10 des variables par importance relative."
---

## Problème

Prédire le prix de vente de biens immobiliers à partir d'un pipeline qui gère à la fois des fichiers historiques en
batch et un flux d'annonces en continu, et fournir aux analystes les tendances de prix par région et les facteurs qui
font le prix.

## Sources de données

- **Batch :** un CSV de ventes immobilières historiques (terrain, zonage, bâtiment, vente).
- **Flux :** un générateur Python qui émet un nouveau bien toutes les 5 secondes, à la place d'un flux Kafka.

## Modèle de données

Couches Raw et Bronze en Parquet partitionné par `year/month/day` ; Silver sépare détails du bien, localisation,
caractéristiques du bâtiment et historique de vente ; Gold calcule tendances de prix, moyennes mobiles, variations
saisonnières, indicateurs de marché et features du modèle. Un ETL alimente trois datamarts MySQL : tendances de prix
par région, impact des caractéristiques et prédictions.

## Choix et compromis

- **Régression linéaire retenue** face au random forest et au gradient boosting : meilleur R² de test (0,910,
  RMSE ≈ 120 k, MAE ≈ 53 k).
- **Partitionnement par date partout**, pour que batch et flux arrivent dans la même structure et soient
  retraitables jour par jour.
- **Flux simulé** par un générateur plutôt qu'un cluster Kafka.
