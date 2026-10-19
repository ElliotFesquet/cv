---
title: "Marketing ROI Optimizer"
summary: "Prédire les ventes à partir de budgets publicitaires multicanaux (TV, radio, réseaux sociaux, influence) pour guider l'allocation."
date: 2026-05-01
stack: [Python, pandas, scikit-learn, XGBoost, Keras, SHAP, FastAPI, Streamlit, React, pytest]
repo: https://github.com/Neonexus45/ProjetDEM2
team: [Elliot Fesquet, Ethan Tomaso]
role: "Pipeline de données, analyse exploratoire, dashboard Streamlit"
architecture: |
  flowchart LR
    csv(["CSV Kaggle<br/>4 572 lignes"])
    subgraph prep["Préparation"]
      pd@{ icon: "logos:pandas-icon", label: "pandas", pos: "b", h: 44 }
      sk(["scikit-learn<br/>Pipeline"])
    end
    subgraph model["Modélisation"]
      lr(["Régression linéaire ★"])
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
    - title: "MAE sur le jeu de test par modèle (plus bas = mieux ; R² ≈ 0,999 pour les trois)"
      bars:
        - { label: Régression linéaire, value: 2.31 }
        - { label: XGBoost, value: 2.60 }
        - { label: Random forest, value: 2.73 }
---

## Problème

À partir d'une combinaison de budgets marketing (TV, radio, réseaux sociaux) et d'un niveau d'influenceur, prédire les
ventes générées et estimer le retour sur investissement. Une tâche secondaire classe les campagnes en performance
faible, moyenne ou forte (seuils : quantiles 33 % et 66 % des ventes). Objectif : un outil d'aide à la décision pour
répartir le budget.

## Sources de données

*Dummy Advertising and Sales Data* (Kaggle) : 4 572 lignes avec les budgets `TV`, `Radio`, `Social_Media`, le niveau
`Influencer` (Nano, Micro, Macro, Mega) et la cible `Sales`. Les 26 valeurs manquantes (0,11 %) ont été supprimées.

## Modèle de données

Trois variables numériques mises à l'échelle (`StandardScaler`), une variable ordinale (Nano < Micro < Macro < Mega)
encodée avec `OrdinalEncoder`, le tout dans un seul `Pipeline` + `ColumnTransformer` `sklearn`. Découpage 80/20
(graine 42). Le meilleur modèle est sauvegardé avec `joblib` et chargé par l'API.

## Choix et compromis

- **Régression linéaire plutôt que boosting.** Meilleur R² en validation croisée (0,9990), MAE la plus basse (2,31) et
  modèle le plus explicable. La relation budget → ventes est quasi linéaire : les ensembles d'arbres et le MLP n'apportaient rien.
- **Préparation dans le pipeline**, pour que le scaler ne soit ajusté que sur le pli d'entraînement.
- **API derrière le dashboard.** L'application Streamlit appelle le service FastAPI, réutilisable par d'autres clients.
