---
title: "Pipeline du marché de l'emploi tech européen"
summary: "Six sources sur les emplois, salaires et tendances technologiques en Europe, fusionnées dans un pipeline médaillon et exposées par une API REST."
date: 2025-07-01
stack: [Python, PySpark, pandas, MySQL, Django REST Framework, Swagger, Postman]
repo: https://github.com/julientremont/Jobtech
team: [Ethan Tomaso, Antoine Vandeplanque, Elliot Fesquet, Julien Tremont-Raimi]
# TODO Elliot : ton rôle
architecture: |
  flowchart LR
    subgraph src["Sources"]
      gt@{ icon: "logos:google-icon", label: "Google Trends", pos: "b", h: 44 }
      gh@{ icon: "logos:github-icon", label: "GitHub", pos: "b", h: 44 }
      so@{ icon: "logos:stackoverflow-icon", label: "Stack Overflow", pos: "b", h: 44 }
      jobs(["Adzuna · EuroTechJobs · Jobicy"])
    end
    bronze@{ icon: "logos:apache-spark", label: "Bronze · PySpark / pandas", pos: "b", h: 44 }
    silver@{ icon: "logos:mysql-icon", label: "Silver · MySQL", pos: "b", h: 44 }
    gold@{ icon: "logos:mysql-icon", label: "Gold · tables unifiées", pos: "b", h: 44 }
    api@{ icon: "logos:django-icon", label: "Django REST · 37 endpoints", pos: "b", h: 44 }
    sw@{ icon: "logos:swagger", label: "Swagger / ReDoc", pos: "b", h: 44 }
    pm@{ icon: "logos:postman-icon", label: "Postman", pos: "b", h: 44 }
    src --> bronze -- "score qualité" --> silver --> gold --> api --> sw & pm
---

## Problème

Analyser le marché tech européen en croisant offres d'emploi, salaires, enquêtes développeurs, popularité open source
et tendances de recherche, puis rendre les résultats interrogeables via une API documentée.

## Sources de données

Google Trends, dépôts GitHub, l'enquête développeurs Stack Overflow (2021–2024), l'API Adzuna (offres et salaires),
EuroTechJobs et l'API Jobicy (emplois en télétravail en Europe).

## Modèle de données

Architecture médaillon : **Bronze** contient les données brutes par source, **Silver** les tables nettoyées et
validées dans une base MySQL `silver`, et **Gold** unifie les sources dans une base `gold` pour l'analyse par pays,
technologie et période.

## Choix et compromis

- **Spark quand le volume l'exige, pandas sinon :** certaines sources ont un traitement PySpark et un traitement pandas.
- **Score qualité automatique (0–100)** sur les enregistrements nettoyés, pour que l'API puisse filtrer les lignes douteuses.
- **Une application Django par source**, chacune avec des endpoints de liste, de synthèse et d'analyse, documentés dans Swagger.
