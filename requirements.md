# Master API & Access Keys Checklist

To fully operationalize the `aifund` autonomous loop, supply the following keys inside your local variables environment:

## 1. LLM Core Compute
- **ANTHROPIC_API_KEY**: Drives logic synthesis.
- **OPENAI_API_KEY**: Secondary optimization validations.

## 2. Quantitative Feeds
- **POLYGON_API_KEY**: Standard pricing datasets.
- **ALPHA_VANTAGE_KEY**: Event disclosures.
- **FRED_API_KEY**: Yield curves.
- **QUANDL_API_KEY**: Economic proxies.

## 3. Alternative Metrics
- **REDDIT_CLIENT_ID** & **REDDIT_CLIENT_SECRET**: Consumer sentiment.
- **WEB_TRAFFIC_API_KEY**: Traffic indexes.
- **SATELLITE_DATA_API_KEY**: Ingestion metrics.
