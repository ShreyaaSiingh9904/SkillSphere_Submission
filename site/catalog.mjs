export const categories = {
  'Programming': `Python|Python 3|Python3
Java|Java SE
JavaScript|JS|ECMAScript|ES6|ES2015
TypeScript|TS
C|C programming|C language
C++|CPP|C plus plus
C#|C sharp
Go|Golang|Go programming
Rust
Kotlin
Swift|Swift programming
Ruby|Ruby programming
PHP
R|R programming|R language
Scala
MATLAB
Bash|Shell scripting|Unix shell
PowerShell
Dart
Solidity
Perl
Lua`,
  'Web and mobile': `HTML|HTML5
CSS|CSS3
React|ReactJS|React.js|React JS
React Native
Redux|Redux Toolkit
Next.js|NextJS|Next JS
Angular|AngularJS|Angular.js
Vue.js|VueJS|Vue JS|Vue
Svelte|SvelteKit
Node.js|NodeJS|Node JS|Node
Express.js|ExpressJS|Express JS|Express
NestJS|Nest.js
Django
Flask
FastAPI|Fast API
Spring Boot|SpringBoot
Spring Framework
.NET|DotNet|.NET Core|ASP.NET|ASP.NET Core
Laravel
Ruby on Rails|Rails
jQuery
Bootstrap
Tailwind CSS|TailwindCSS|Tailwind
Sass|SCSS
Webpack
Vite
REST APIs|REST API|RESTful API|RESTful APIs|REST|RESTful services|REST API development|RESTful web services
GraphQL
gRPC
WebSockets|WebSocket
Flutter
Android Development|Android SDK|Android Studio
iOS Development|iOS SDK|Xcode
Responsive Design|Responsive Web Design|Responsive Layouts
Web Accessibility|WCAG|A11y
OAuth|OAuth2|OAuth 2.0
JWT|JSON Web Tokens|JSON Web Token
JSON
XML
WordPress`,
  'Data and AI': `SQL|Structured Query Language
MySQL
PostgreSQL|Postgres|Postgre SQL
SQLite
Microsoft SQL Server|MS SQL Server|SQL Server|MSSQL
Oracle Database|Oracle DB|Oracle SQL
MongoDB|Mongo DB
Redis
Firebase|Firestore
Supabase
DynamoDB
Elasticsearch|Elastic Search
NoSQL|No SQL
Database Design|Data Modeling|Data Modelling|Database Modelling|Schema Design
Excel|Microsoft Excel|MS Excel|Advanced Excel
Google Sheets
Power BI|PowerBI|Microsoft Power BI
Tableau
Pandas
NumPy|Num Py
Matplotlib
Seaborn
Plotly
Statistics|Statistical Analysis
Data Analysis|Data Analytics
Data Visualization|Data Visualisation|Data Viz
Data Cleaning|Data Cleansing|Data Preprocessing
Machine Learning|ML
Deep Learning|DL
Natural Language Processing|NLP
Computer Vision|CV
Large Language Models|LLM|LLMs
Retrieval-Augmented Generation|RAG|Retrieval Augmented Generation
Prompt Engineering
Generative AI|GenAI|Gen AI
TensorFlow|Tensor Flow
PyTorch|Torch
scikit-learn|Scikit Learn|sklearn
Keras
OpenCV
Hugging Face|HuggingFace
LangChain
Vector Databases|Vector Database|Vector DB
Apache Spark|PySpark|Spark
Hadoop
Apache Kafka|Kafka
Apache Airflow|Airflow
ETL|Extract Transform Load
dbt
Snowflake
BigQuery
Databricks
Jupyter|Jupyter Notebook|JupyterLab
A/B Testing|AB Testing|Split Testing`,
  'Infrastructure and security': `Git|Git Version Control
GitHub
GitLab
Bitbucket
Linux|GNU/Linux|Ubuntu|Debian|Red Hat Linux
Docker|Docker Containers|Dockerfile
Docker Compose
Kubernetes|K8s
Helm
AWS|Amazon Web Services
Azure|Microsoft Azure
Google Cloud|Google Cloud Platform|GCP
Terraform
Ansible
Jenkins
GitHub Actions|GH Actions
CI/CD|CI CD|CICD|Continuous Integration and Continuous Delivery|Continuous Integration and Continuous Deployment
Continuous Integration
Continuous Delivery|Continuous Deployment
Nginx
Prometheus
Grafana
Cloud Computing|Cloud Fundamentals
Microservices|Microservice Architecture
TCP/IP|TCP IP
Networking|Computer Networks
DNS|Domain Name System
Cybersecurity|Cyber Security|Information Security
OWASP
Encryption|Cryptography
IAM|Identity and Access Management
SOC|Security Operations Center
SIEM|Security Information and Event Management`,
  'Engineering and QA': `Data Structures and Algorithms|DSA|Data Structures & Algorithms|Algorithms and Data Structures|Data Structures
Object-Oriented Programming|OOP|Object Oriented Programming|OOPS
System Design
Design Patterns
Problem Solving|Problem-Solving
DBMS|Database Management Systems
Operating Systems|OS Fundamentals
Testing|Software Testing|Quality Assurance|QA
Unit Testing|Unit Tests
Integration Testing|Integration Tests
Test Automation|Automated Testing|Automation Testing
Selenium
Cypress
Playwright
Jest
Vitest
pytest|py.test
JUnit
Postman
Agile
Scrum
Jira|JIRA
Technical Documentation|Technical Writing`,
  'Design and business': `Figma
Adobe XD
Photoshop|Adobe Photoshop
Illustrator|Adobe Illustrator
UX Design|User Experience Design|UX
UI Design|User Interface Design|UI
UI/UX|UX/UI
User Research|UX Research
Wireframing|Wireframes
Prototyping|Interactive Prototypes
Usability Testing
Communication|Communication Skills
Teamwork|Team Work|Collaboration
Leadership
Project Management
Stakeholder Management
Business Analysis
Requirements Gathering|Requirements Elicitation
Digital Marketing
SEO|Search Engine Optimization|Search Engine Optimisation
Google Analytics|GA4
Financial Modeling|Financial Modelling
Salesforce
CRM|Customer Relationship Management
AutoCAD
SolidWorks
Arduino
Raspberry Pi
Internet of Things|IoT
Embedded Systems`
};

const labs = {
  SQL: ['a query file and result screenshots', 'create two small tables, then use joins, grouping and a window function to answer role-related questions', 'compare three queries with hand-calculated results and test missing and duplicate rows'],
  React: ['a small React dashboard', 'build components with props and state, a filter, and loading and empty views', 'verify that filtering works and that the list responds to changing data'],
  Docker: ['a Dockerfile and a setup README', 'containerise a tiny app and configure its port and environment', 'build the image and start a fresh container using only the README'],
  'REST APIs': ['an API with a collection of example requests', 'implement GET and POST with simple input validation and status codes', 'exercise success, invalid input and missing records'],
  'Power BI': ['a dashboard with a data dictionary', 'import two tables, relate them, create a measure and add a filter', 'check totals against the source and show how a filter changes them'],
  Git: ['a repository with a feature branch and merge', 'make small commits, resolve a practice merge conflict and tag a working version', 'clone to a fresh folder and explain the history using git log'],
  'Machine Learning': ['a notebook with baseline metrics', 'split a public sample dataset, fit a baseline and a model, and compare a held-out metric', 'check data leakage and record where the model makes mistakes'],
  Figma: ['a clickable prototype with feedback notes', 'wireframe one user flow, make reusable components and connect the screens', 'observe someone completing the flow and revise one confusing screen'],
  Python: ['a small Python command-line tool', 'read data from a CSV, validate rows and print a compact summary', 'run it against empty, malformed and valid sample files'],
  JavaScript: ['an interactive browser page', 'build a form, keep state in JavaScript and update the DOM on user actions', 'verify keyboard input, empty state and malformed input'],
  TypeScript: ['a typed utility with examples', 'model the data with interfaces and handle a union of success and error states', 'run the type checker and exercise normal and boundary inputs'],
  Kubernetes: ['deployment and service manifests', 'deploy a tiny sample app, add readiness checks and scale replicas', 'replace a pod and verify the service still responds'],
  AWS: ['an architecture diagram and a reproducible demo', 'build or emulate a small storage-and-compute workflow and document its IAM permissions', 'check denied and allowed access and show how to remove demo resources'],
  Excel: ['a workbook with a pivot table and chart', 'clean a small dataset, use lookups and build a pivot summary', 'reconcile the totals and test a missing lookup value'],
  'Unit Testing': ['a repeatable unit-test suite', 'choose a small function and cover normal behavior, boundaries and invalid inputs', 'introduce one defect and show that an assertion catches it'],
  'CI/CD': ['a pipeline config and run log', 'configure a commit-triggered pipeline to run checks and produce a build artifact', 'introduce and fix a failing check and compare both runs'],
  MongoDB: ['a small collection and query script', 'model related records and build a filtered query and aggregation', 'test both existing and missing records and compare a query with and without an index'],
  'Data Visualization': ['a chart with a short interpretation', 'create a graphic for a specific question, with units, accessible labels and a useful comparison', 'verify plotted values and ask a reader to explain the main takeaway']
};

const workshop = {
  Programming: ['a small program and its sample output', 'write a tool that validates a small input and produces a result', 'run normal, boundary and malformed examples'],
  'Web and mobile': ['a working screen or component and a short recording', 'build a small interaction with a clear loading, empty or error state', 'run the main flow on narrow and wide screens and test a failure case'],
  'Data and AI': ['a short analysis and a reproducible input file', 'use a small public dataset to answer one question and record your steps', 'recompute one value independently and document a limitation'],
  'Infrastructure and security': ['a configuration file or lab notes with run output', 'set up a small local practice workflow and document what each setting controls', 'repeat the setup and verify one success and one controlled failure'],
  'Engineering and QA': ['a small lab project and verification notes', 'apply the technique to an existing toy problem and write down the assumptions', 'check an ordinary case, a boundary case and a failure case'],
  'Design and business': ['a short case study with a concrete deliverable', 'choose a realistic task, create a first version and collect one piece of feedback', 'check the deliverable against a measurable goal and record one improvement']
};

export const catalog = Object.entries(categories).flatMap(([category, entries]) =>
  entries.split('\n').map(line => {
    const [name, ...aliases] = line.split('|');
    return { name, aliases: [name, ...aliases], category, lab: labs[name] || workshop[category] };
  })
);
