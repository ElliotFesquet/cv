---
title: "Plateforme de données mobilité Paris sur AWS"
summary: "Un lakehouse Bronze/Silver/Gold sur AWS pour le trafic, le stationnement et les départs de trains à Paris, exposé par une API serverless."
date: 2025-11-01
stack: [Python, pandas, AWS S3, AWS EC2, DynamoDB, AWS Lambda, API Gateway, Streamlit, uv]
repo: https://github.com/antoinevdp/project_cloud
# TODO Elliot : membres de l'équipe et ton rôle
architecture: |
  flowchart LR
    subgraph src["Open data Paris"]
      traffic(["Trafic"])
      parking(["Parkings"])
      trains(["Départs de trains"])
    end
    ec2@{ icon: "logos:aws-ec2", label: "EC2 · ingestion", pos: "b", h: 44 }
    subgraph lake["Lakehouse"]
      s3@{ icon: "logos:aws-s3", label: "S3 · Bronze", pos: "b", h: 44 }
      silver@{ icon: "logos:aws-dynamodb", label: "DynamoDB · Silver", pos: "b", h: 44 }
      gold@{ icon: "logos:aws-dynamodb", label: "DynamoDB · Gold", pos: "b", h: 44 }
    end
    lambda@{ icon: "logos:aws-lambda", label: "Lambda", pos: "b", h: 44 }
    gw@{ icon: "logos:aws-api-gateway", label: "API Gateway · 13 endpoints", pos: "b", h: 44 }
    st@{ icon: "logos:streamlit", label: "Streamlit", pos: "b", h: 44 }
    src --> ec2 --> s3 -- "nettoyage" --> silver -- "reporting" --> gold
    silver & gold --> lambda --> gw
    %% TODO Elliot: check whether Streamlit reads DynamoDB directly or goes through the API
    gold -.-> st
---

## Problème

Collecter et exposer les données publiques de mobilité à Paris (trafic en direct, disponibilité des parkings, départs
de trains) sur une plateforme cloud scalable, avec des analyses : où le trafic est congestionné, à quel point les
parkings sont pleins, quels réseaux et destinations concentrent le plus de départs.

## Sources de données

API open data de Paris et des transports pour le trafic, les parkings et les départs, interrogées périodiquement par
les scripts d'ingestion.

<!-- TODO Elliot : noms exacts des sources (ex. Paris open data, API SNCF) et fréquence de collecte -->

## Modèle de données

- **Bronze :** réponses brutes des API stockées en fichiers dans S3, zone d'atterrissage du data lake.
- **Silver :** enregistrements nettoyés et enrichis dans DynamoDB, une table par domaine (trafic, parkings, départs).
- **Gold :** tables d'agrégats produites par un job de reporting : occupation et tarifs de référence des parkings,
  indice de congestion et fluidité par zone, départs par réseau et principales destinations.

## Choix et compromis

- **API serverless** (Lambda + API Gateway) : aucun serveur à faire tourner pour la lecture, coût proportionnel à l'usage.
- **DynamoDB pour l'exposition :** lectures par clé du dernier état et d'agrégats pré-calculés, plutôt que des requêtes sur S3.
- **Jobs batch sur EC2** orchestrés par des scripts shell, dépendances gérées avec `uv` et un lock file pour des
  installations reproductibles.
