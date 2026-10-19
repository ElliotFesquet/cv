---
title: "Paris Mobility Data Platform on AWS"
summary: "A Bronze/Silver/Gold lakehouse on AWS for Paris traffic, parking and train departures, served by a serverless API."
date: 2025-11-01
stack: [Python, pandas, AWS S3, AWS EC2, DynamoDB, AWS Lambda, API Gateway, Streamlit, uv]
repo: https://github.com/antoinevdp/project_cloud
# TODO Elliot: team members and your role
architecture: |
  flowchart LR
    subgraph src["Paris open data"]
      traffic(["Traffic"])
      parking(["Car parks"])
      trains(["Train departures"])
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
    src --> ec2 --> s3 -- "clean" --> silver -- "reporting" --> gold
    silver & gold --> lambda --> gw
    %% TODO Elliot: check whether Streamlit reads DynamoDB directly or goes through the API
    gold -.-> st
---

## Problem

Collect and expose public mobility data for Paris (live traffic, car park availability, train departures) on a
scalable cloud platform, with analytics on top: where traffic is congested, how full car parks are, which networks and
destinations have the most departures.

## Data sources

Paris and transport open-data APIs for traffic, parking and departures, polled periodically by ingestion scripts.

<!-- TODO Elliot: exact source names (e.g. Paris open data, SNCF API) and polling frequency -->

## Data model

- **Bronze:** raw API responses stored as files in S3, the landing zone of the data lake.
- **Silver:** cleaned and enriched records in DynamoDB, one table per domain (traffic, parking, departures).
- **Gold:** aggregate tables built by a reporting job: parking occupancy and reference pricing, traffic congestion
  index and fluidity by zone, departures by network and top destinations.

## Decisions and tradeoffs

- **Serverless API** (Lambda + API Gateway): no server to run for reads, and cost follows usage.
- **DynamoDB for serving:** key-based reads of the latest state and pre-computed aggregates, rather than querying S3.
- **Batch jobs on EC2** orchestrated by shell pipelines, managed with `uv` and a lock file for reproducible installs.
