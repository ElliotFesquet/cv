---
title: "Lakehouse des accidents de la route aux États-Unis"
summary: "Un lakehouse Spark sur les accidents de la route aux États-Unis : impact de la météo, prédiction de la gravité, une API et un dashboard."
date: 2025-06-01
stack: [Python, PySpark, Parquet, MySQL, scikit-learn, FastAPI, Streamlit, Docker]
repo: https://github.com/Neonexus45/tp-bigdata
# TODO Elliot : membres de l'équipe et ton rôle
architecture: |
  flowchart LR
    csv(["US Accidents CSV"])
    subgraph lake["Lakehouse · Docker Compose"]
      bronze@{ icon: "logos:apache-spark", label: "Feeder · Bronze Parquet", pos: "b", h: 44 }
      silver@{ icon: "logos:apache-spark", label: "Preprocessor · Silver", pos: "b", h: 44 }
      gold@{ icon: "logos:apache-spark", label: "Datamart · analyses météo", pos: "b", h: 44 }
    end
    ml(["scikit-learn<br/>modèle de gravité"])
    db@{ icon: "logos:mysql-icon", label: "MySQL", pos: "b", h: 44 }
    api@{ icon: "logos:fastapi-icon", label: "FastAPI", pos: "b", h: 44 }
    st@{ icon: "logos:streamlit", label: "Streamlit", pos: "b", h: 44 }
    dk@{ icon: "logos:docker-icon", label: "Docker", pos: "b", h: 44 }
    csv --> bronze --> silver --> gold --> db
    silver --> ml --> db
    db --> api & st
    dk -.- lake
---

## Problème

Construire un lakehouse en couches sur les accidents de la route aux États-Unis pour mesurer le lien entre conditions
météo, fréquence et gravité des accidents, et prédire la gravité d'un accident.

## Sources de données

Le jeu de données US Accidents, chargé en CSV.

<!-- TODO Elliot : version et volume du jeu de données (lignes, années couvertes) -->

## Modèle de données

- **Bronze (feeder) :** CSV brut converti en Parquet, partitionné par date, validation de base.
- **Silver (preprocessor) :** valeurs manquantes traitées, formats standardisés, découpage en jeux thématiques.
- **Gold (datamart) :** tables météo/fréquence, météo/gravité et tendances écrites dans MySQL, plus les tables de
  features ML et les modèles stockés.

## Choix et compromis

- **DataFrames Spark de bout en bout :** pandas a été retiré du pipeline en version 2 pour les performances.
- **Classes core partagées** (`Config`, `Logger` avec rotation des fichiers, `SparkManager` singleton) réutilisées par chaque job.
- **Jobs dockerisés** (`docker-compose`), un script par couche pour pouvoir relancer chaque couche seule.
