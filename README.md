# Financial Data Analyst Agent

## Overview

Financial Data Analyst Agent is an AI-powered analytics platform designed to automate financial data processing, analysis, visualization, and reporting. The system leverages Agentic AI workflows to transform raw financial datasets into actionable business insights while providing a conversational interface for querying data in natural language.

The platform supports CSV and JSON datasets, performs automated data cleaning and exploratory data analysis (EDA), generates visualizations, creates AI-driven reports, and enables users to interact with their data through a Retrieval-Augmented Generation (RAG) chatbot.

---
Deployed link: https://analystiq-462632670703.asia-southeast1.run.app
## Features

### Data Processing

* Upload CSV and JSON financial datasets
* Automatic data validation and preprocessing
* Missing value handling
* Outlier detection and treatment
* Data type conversion and normalization
* Feature engineering for financial metrics

### Automated Exploratory Data Analysis (EDA)

* Descriptive statistics generation
* Correlation analysis
* Distribution analysis
* Trend identification
* Financial KPI calculations
* Data quality assessment

### Data Visualization

* Interactive charts and graphs
* Trend analysis dashboards
* Correlation heatmaps
* Distribution plots
* Time-series visualizations
* Business performance reports

### AI-Powered Reporting

* Automated financial insights generation
* Executive summary creation
* Risk and anomaly detection
* Business recommendations
* Natural language report generation

### Conversational AI Assistant

* RAG-based financial chatbot
* Natural language querying
* Context-aware responses
* Dataset-specific question answering
* Insight retrieval from generated reports

---

## Architecture

The project follows an Agentic AI architecture using LangGraph for workflow orchestration.

### Workflow Pipeline

1. Data Ingestion Agent
2. Data Cleaning Agent
3. Feature Engineering Agent
4. EDA Agent
5. Visualization Agent
6. Report Generation Agent
7. RAG Chatbot Agent

Each agent performs a specific task and passes the processed information to the next stage in the workflow.

---

## Technology Stack

### Programming Language

* Python

### AI & Agent Frameworks

* LangGraph
* LangChain
* Ollama

### Data Analysis

* Pandas
* NumPy

### Data Visualization

* Matplotlib
* Seaborn

### API Development

* FastAPI

### Vector Database

* ChromaDB / FAISS

### Database

* SQLite / PostgreSQL


## Installation

### Clone Repository

```bash
git clone https://github.com/yourusername/Financial-Data-Analyst-Agent.git

cd Financial-Data-Analyst-Agent
```

### Create Virtual Environment

```bash
python -m venv venv

source venv/bin/activate
```

### Install Dependencies

```bash
pip install -r requirements.txt
```

### Run Application

```bash
uvicorn api.main:app --reload
```

---

## Example Workflow

### Step 1: Upload Dataset

Users upload financial data in CSV or JSON format.

### Step 2: Automated Processing

The system automatically:

* Cleans data
* Handles missing values
* Detects anomalies
* Creates derived features

### Step 3: Analysis

The EDA engine generates:

* Statistical summaries
* Trends
* Correlations
* Business insights

### Step 4: Report Generation

An AI-generated report summarizes:

* Key findings
* Financial performance
* Risks
* Recommendations

### Step 5: Chat with Data

Example Questions:

```text
What are the top-performing financial metrics?

Which month had the highest revenue?

Show revenue trends over time.

What anomalies exist in the dataset?

Summarize key financial insights.
```

---

## Future Enhancements

* Real-time financial data integration
* Power BI dashboard integration
* Multi-user authentication
* Cloud deployment
* Advanced forecasting models
* Multi-agent collaboration improvements
* Support for additional data sources

---

## Learning Outcomes

Through this project, I gained practical experience in:

* Agentic AI Systems
* LangGraph Workflow Orchestration
* LangChain Applications
* Retrieval-Augmented Generation (RAG)
* Financial Data Analysis
* Exploratory Data Analysis (EDA)
* FastAPI Development
* Data Visualization
* Vector Databases
* End-to-End AI Application Development

---

## Author

Developed as part of a Data Science Internship project focused on Agentic AI, Financial Analytics, and Conversational Data Intelligence.

Feel free to contribute, raise issues, or suggest improvements.
