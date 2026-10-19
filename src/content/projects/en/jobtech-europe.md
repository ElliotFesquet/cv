---
title: "European Tech Job Market Pipeline"
summary: "Six sources on tech jobs, salaries and technology trends in Europe, merged in a medallion pipeline and served by a REST API."
date: 2025-07-01
stack: [Python, PySpark, pandas, MySQL, Django REST Framework, Swagger, Postman]
repo: https://github.com/julientremont/Jobtech
team: [Ethan Tomaso, Antoine Vandeplanque, Elliot Fesquet, Julien Tremont-Raimi]
# TODO Elliot: your role
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
    gold@{ icon: "logos:mysql-icon", label: "Gold · unified tables", pos: "b", h: 44 }
    api@{ icon: "logos:django-icon", label: "Django REST · 37 endpoints", pos: "b", h: 44 }
    sw@{ icon: "logos:swagger", label: "Swagger / ReDoc", pos: "b", h: 44 }
    pm@{ icon: "logos:postman-icon", label: "Postman", pos: "b", h: 44 }
    src --> bronze -- "quality score" --> silver --> gold --> api --> sw & pm
---

## Problem

Analyse the European tech market by combining job offers, salaries, developer surveys, open-source popularity and
search trends, then make the results queryable through a documented API.

## Data sources

Google Trends, GitHub repositories, the Stack Overflow developer survey (2021–2024), the Adzuna jobs API (jobs and
salaries), EuroTechJobs and the Jobicy API (European remote jobs).

## Data model

Medallion architecture: **Bronze** holds raw data per source, **Silver** holds cleaned, validated tables in a `silver`
MySQL database, and **Gold** unifies sources in a `gold` database for analysis by country, technology and period.

## Decisions and tradeoffs

- **Spark where volume needs it, pandas elsewhere:** some sources have both a PySpark and a pandas processor.
- **Automated quality score (0–100)** on cleaned records, so the API can filter out low-quality rows.
- **One Django app per source**, each with list, summary and analysis endpoints, documented in Swagger.
