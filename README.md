# FundFlow App

FundFlow App is a full-stack personal finance tracker with a Spring Boot backend and a React/Vite frontend. It supports account management, categorized transactions, monthly budgets, and summary/reporting views for income, expenses, investments, and transfers.

## Project Structure

```text
fundflowapp/
├── backend/   # Spring Boot API + PostgreSQL persistence
└── frontend/  # React SPA built with Vite
```

## What The App Does

- Register and log in with JWT-based authentication
- Create and list financial accounts
- Create custom categories for `INCOME`, `EXPENSE`, `INVESTMENT`, and `TRANSFER`
- Record transactions, including account-to-account transfers
- Define monthly budgets per expense category
- View dashboards and reports for balances, summaries, category breakdowns, and trends

## Tech Stack

### Backend

- Java 17
- Spring Boot
- Spring Security
- Spring Data JPA
- PostgreSQL
- JWT (`jjwt`)
- Lombok
- Spock, JUnit, Mockito, H2 for tests

### Frontend

- React 19
- Vite
- React Router
- Redux Toolkit
- Axios
- Recharts
- Lucide React

## Backend Overview

The backend exposes REST endpoints under `/api` and secures everything except `/api/auth/**` with a JWT filter.

Core areas:

- `AuthController`: register, login, refresh token
- `AccountController`: create and list user accounts
- `CategoryController`: create and list categories
- `TransactionController`: create and list transactions
- `BudgetController`: create and list budgets
- `ReportController`: balances, summaries, category breakdowns, and trend reports

Business logic lives in `service/`, persistence in `repository/`, and transaction balance updates are handled through a strategy pattern in `strategy/`.

## Frontend Overview

The frontend is a protected single-page app. After login, users can navigate to:

- Dashboard
- Transactions
- Accounts
- Categories
- Budgets
- Reports

The app stores the access token and refresh token in `localStorage` and sends the access token in the `Authorization` header through an Axios interceptor.

## Default Local Configuration

The backend currently reads its database and JWT settings from [`backend/src/main/resources/application.yaml`](/Users/iamic.dev/Sandbox/java-projects/fundflowapp/backend/src/main/resources/application.yaml).

Current expectations from the checked-in config:

- PostgreSQL running on `localhost:5432`
- Database name: `fundflowapp`
- JPA schema mode: `update`
- Backend port: `8080` by Spring Boot default
- Frontend dev server: `http://localhost:5173`

Before using this outside local development, replace the hardcoded database credentials and JWT secret with environment-specific configuration.

## Running The Project

### 1. Start PostgreSQL

Create a local database named `fundflowapp` and update the datasource settings in [`backend/src/main/resources/application.yaml`](/Users/iamic.dev/Sandbox/java-projects/fundflowapp/backend/src/main/resources/application.yaml) if your username, password, or host differ.

### 2. Run the backend

```bash
cd backend
./gradlew bootRun
```

API base URL:

```text
http://localhost:8080/api
```

### 3. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

## Build And Test

### Backend tests

```bash
cd backend
./gradlew test
```

### Frontend production build

```bash
cd frontend
npm run build
```

Verified from this workspace:

- `backend`: `./gradlew test` passed
- `frontend`: `npm run build` passed

## Main API Endpoints

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh?refreshToken=...`

### Accounts

- `GET /api/accounts`
- `POST /api/accounts`

### Categories

- `GET /api/categories`
- `POST /api/categories`

### Transactions

- `GET /api/transactions`
- `POST /api/transactions`

### Budgets

- `GET /api/budgets?month=MM&year=YYYY`
- `POST /api/budgets`

### Reports

- `GET /api/reports/accounts/balances`
- `GET /api/reports/summary/daily`
- `GET /api/reports/summary/weekly`
- `GET /api/reports/summary/monthly`
- `GET /api/reports/summary/yearly`
- `GET /api/reports/summary/range`
- `GET /api/reports/breakdown/daily`
- `GET /api/reports/breakdown/weekly`
- `GET /api/reports/breakdown/monthly`
- `GET /api/reports/breakdown/yearly`
- `GET /api/reports/breakdown/range`
- `GET /api/reports/trend/weekly`
- `GET /api/reports/trend/monthly`
- `GET /api/reports/trend/yearly`
- `GET /api/reports/trend/range`

Sample request snippets are available in [`backend/client-request.rest`](/Users/iamic.dev/Sandbox/java-projects/fundflowapp/backend/client-request.rest).

## Supported Domain Types

### Account types

- `BANK`
- `CREDIT_CARD`
- `LOAN`
- `E_WALLET`
- `CASH`
- `INVESTMENT`
- `OTHER`

### Transaction and category types

- `INCOME`
- `EXPENSE`
- `TRANSFER`
- `INVESTMENT`

## Notes And Caveats

- The checked-in frontend README is still the default Vite template and does not document this app.
- CORS is currently configured for `http://localhost:5173` only.
- Tokens are stored in `localStorage`, which is simple for development but not ideal for higher-security deployments.
- The frontend build currently emits a large chunk warning, so code-splitting may be worth addressing later.

## Suggested Next Improvements

- Move secrets and database credentials to environment variables
- Add a database migration tool such as Flyway or Liquibase
- Add form validation and backend error handling consistency
- Add refresh-token rotation and logout invalidation flows
- Add end-to-end tests for the main user journeys
