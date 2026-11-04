# 🪙 Currency Counter

> **Professional Offline Cash Denomination Counter & Financial Calculators Suite supporting 47+ Global Currencies.**

---

### ⚠️ Legal Notice & License Restriction
> **Written permission is strictly required from the maker for every personal and professional use of this project and its contents.**
>
> All intellectual property, source code, design assets, and materials contained in this repository are proprietary. No personal, commercial, educational, or professional use, deployment, redistribution, modification, or inclusion in third-party products is allowed without prior written consent from the maker. Please refer to the [LICENSE](./LICENSE) file for complete terms.

---

## 📌 Overview

**Currency Counter** is a high-performance, offline-first web and mobile application designed for retail cashiers, accountants, treasury managers, travelers, and businesses worldwide. It eliminates manual cash tally errors by providing real-time banknote and coin denomination calculations, amount-in-words conversion, cashier slip printing, and a full suite of institutional financial calculators.

---

## 🌟 Key Features

### 1. 💵 Cash Denomination Counter
* **Banknote & Coin Counting**: Quick denomination inputs with intuitive increment/decrement controls.
* **Dual Numbering Systems**: Real-time amount-in-words conversion in both:
  * **Indian Numbering System** (Rupees, Lakhs, Crores, Paise).
  * **International System** (Dollars/Euros/Pounds, Millions, Billions, Cents).
* **Custom Denominations**: Add custom cash or token values on the fly.
* **Denomination Statuses**: Tag denominations as standard *Circulation*, *Rare collector*, or *Delisted* notes.
* **Cash Closing & Slip Printing**: Generate clean, professional receipts and tally summaries with employee names, departments, date/time, and remarks.

### 2. 🧮 Institutional Financial Calculators
* **Fixed Deposit (FD) Calculator**:
  * Simple and Compound Interest calculations.
  * Flexible compounding frequencies: Monthly, Quarterly, Half-Yearly, and Yearly.
  * Real-time breakdown of maturity amount, principal invested, and total interest earned.
* **SIP (Systematic Investment Plan) Wealth Calculator**:
  * Projects long-term wealth accumulation for mutual funds and monthly investment plans.
  * Calculates invested capital, expected returns, and maturity corpus.
* **Recurring Deposit (RD) Calculator**:
  * Calculates maturity values for monthly recurring bank deposits.
* **Loan EMI Calculator**:
  * Calculates monthly Equated Monthly Installments (EMI) for home loans, personal loans, or vehicle financing.
  * Detailed payment breakdown between principal repayment and cumulative interest.

### 3. 💱 Global Currency Converter
* Instant currency exchange conversions across 47+ global currencies.
* Pre-cached offline exchange rates ensuring zero downtime even without an active internet connection.

### 4. 🌍 Interactive 3D Earth Globe
* Built using **Three.js** with high-resolution texture mapping and atmospheric limb illumination.
* Allows users to visually explore and select countries geographically with smooth camera transitions and coordinate pinning.

### 5. 🏢 Cashier & Department Reconciliation
* Organizes saved cash counts by department (Accounts & Finance, Retail, Treasury, Front Desk).
* Multi-cashier management with employee ID tagging.
* Aggregates total cash holdings, note distributions, and audit histories.

### 6. 📱 100% Offline Progressive Web App (PWA)
* Offline-first architecture powered by Service Workers and Cache API.
* Installable on desktop (Chrome, Edge, Safari) and mobile (Android, iOS) as a standalone app.
* Ultra-fast load times with compressed assets and zero reliance on external cloud servers for daily operations.

### 7. 🛡️ Enterprise-Grade Security Shield
* **Zero Client Secrets**: All sensitive server operations (AI assistants, feedback relays) run exclusively behind secure server-side proxy routes.
* **In-Memory Rate Limiting**: Protects against brute-force, DoS attacks, and automated spam.
* **Prototype Pollution Neutralization**: Sanitizes incoming payloads to prevent object pollution vectors.
* **Anti-Path Traversal Protection**: Rejects null-byte injections, directory traversals, and unauthorized file access.
* **Strict Content-Security-Policy (CSP)**: Hardened headers to prevent cross-site scripting (XSS) and clickjacking.

---

## 🌐 Supported Countries & Currencies (47+ Nations)

Currency Counter covers official currencies across 6 continents:

| Continent | Countries & Currencies |
| :--- | :--- |
| **Asia** | Bharat / India (`INR`), China (`CNY`), Japan (`JPY`), South Korea (`KRW`), Singapore (`SGD`), Malaysia (`MYR`), Indonesia (`IDR`), Vietnam (`VND`), Thailand (`THB`), Philippines (`PHP`), Bangladesh (`BDT`), Pakistan (`PKR`), Sri Lanka (`LKR`), Nepal (`NPR`), Hong Kong (`HKD`) |
| **Europe** | Eurozone 19+ Countries (`EUR`), United Kingdom (`GBP`), Switzerland (`CHF`), Norway (`NOK`), Sweden (`SEK`), Denmark (`DKK`), Poland (`PLN`), Russia (`RUB`), Turkey (`TRY`) |
| **Middle East** | United Arab Emirates (`AED`), Saudi Arabia (`SAR`), Qatar (`QAR`), Kuwait (`KWD`), Oman (`OMR`), Bahrain (`BHD`), Israel (`ILS`) |
| **Americas** | United States (`USD`), Canada (`CAD`), Mexico (`MXN`), Brazil (`BRL`), Argentina (`ARS`), Colombia (`COP`) |
| **Africa** | South Africa (`ZAR`), Nigeria (`NGN`), Egypt (`EGP`), Kenya (`KES`), Cameroon (`XAF`), Gabon (`XAF`), Côte d'Ivoire (`XOF`), Senegal (`XOF`) |
| **Oceania** | Australia (`AUD`), New Zealand (`NZD`) |

---

## 🛠️ Tech Stack

* **Frontend**:
  * [React 19](https://react.dev/) – Modern component architecture
  * [TypeScript](https://www.typescriptlang.org/) – Strict type safety
  * [Tailwind CSS v4](https://tailwindcss.com/) – Responsive modern styling
  * [Lucide React](https://lucide.dev/) – Crisp vector iconography
  * [Three.js](https://threejs.org/) – WebGL 3D Earth Globe rendering
  * [Motion](https://motion.dev/) – Smooth UI micro-interactions
* **Backend & Server**:
  * [Node.js](https://nodejs.org/) & [Express](https://expressjs.com/) – Full-stack backend server
  * [tsx](https://github.com/privatenumber/tsx) – Native TypeScript execution
  * [compression](https://github.com/expressjs/compression) – Gzip / Deflate payload optimization
* **Tooling & Build**:
  * [Vite 6](https://vitejs.dev/) – Ultra-fast development and build pipeline
  * [esbuild](https://esbuild.github.io/) – Server-side production bundling

---

## 📂 Project Structure

```text
├── public/                 # Static assets, icons, manifest, service worker & sitemaps
│   ├── app-icon.png        # Master application icon
│   ├── assets/             # Textures (NASA Earth texture, etc.)
│   ├── manifest.webmanifest# PWA manifest
│   ├── robots.txt          # Search engine crawler directives
│   ├── sitemap.xml         # SEO sitemap with Google image indexing
│   └── sw.js               # Service Worker for 100% offline functionality
├── src/
│   ├── components/         # Modular React UI components
│   │   ├── ConversionView.tsx          # Multi-currency exchange converter
│   │   ├── DenominationRow.tsx         # Note & coin counter row item
│   │   ├── DepartmentAnalysisView.tsx  # Department & cashier breakdown
│   │   ├── EarthGlobeLanding.tsx       # 3D Three.js interactive Earth globe
│   │   ├── FinancialCalculators.tsx    # FD, SIP, RD, and Loan EMI calculators
│   │   ├── HistoryView.tsx             # Saved tallies history and search
│   │   └── SummaryStickyBar.tsx        # Real-time sticky total & figures bar
│   ├── data/               # 47+ country currencies and coordinates
│   │   ├── countriesAfricaOceania.ts
│   │   ├── countriesAmericas.ts
│   │   ├── countriesAsia.ts
│   │   ├── countriesEurope.ts
│   │   ├── countriesMiddleEast.ts
│   │   └── currencies.ts
│   ├── utils/              # Calculation engines & security helpers
│   │   ├── anonymousHitCounter.ts      # Privacy-first visit counters
│   │   ├── numberToWords.ts            # Indian & International number-to-words
│   │   └── security.ts                 # Input sanitization and HTML escaping
│   ├── App.tsx             # Root application orchestrator
│   ├── main.tsx            # React DOM mounting entry point
│   └── types.ts            # Master TypeScript type definitions
├── server.ts               # Secure Express backend server with security headers
├── .env.example            # Sample environment configuration template
├── package.json            # Project dependencies and build scripts
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite build and bundle configuration
├── LICENSE                 # Proprietary license agreement
└── README.md               # Repository documentation
```

---

## 🚀 Getting Started

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher (or pnpm / yarn)

### 1. Clone & Install
```bash
# Clone the repository
git clone https://github.com/<your-username>/<your-repo-name>.git

# Navigate into the project folder
cd currency-counter

# Install project dependencies
npm install
```

### 2. Environment Setup
Copy the `.env.example` file to create your local `.env`:
```bash
cp .env.example .env
```
*(Optional: If utilizing server-side Gemini AI features, configure `GEMINI_API_KEY` in `.env`)*

### 3. Run in Development Mode
Start the development server with Vite hot-reloading:
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:3000`.

### 4. Production Build & Deployment
To generate an optimized production bundle:
```bash
# Build frontend assets and bundle the server
npm run build

# Start the production server
npm start
```

### 5. Typecheck & Verification
Run the TypeScript compiler to verify zero lint or type errors:
```bash
npm run lint
```

---

## 🔒 Privacy & Data Confidentiality

* **100% Offline Operation**: Your financial tallies, employee records, and cash balances remain strictly on your local device.
* **No Tracking or Personal Profiling**: Zero personal identity data is collected, monitored, or transmitted.
* **Anonymous Statistics**: Server telemetry, if enabled, registers only aggregate numeric hit counts without IP or identifier logging.

---

## 📜 Written Permission Inquiries

As stated in the [LICENSE](./LICENSE), **written permission is required from the maker for every personal and professional use of this project and its contents**.

To request licensing, commercial deployment permission, or personal use authorization, please reach out directly to the project maker through the official **GitHub Repository Communications** (open an Issue or Discussion on GitHub).

---

© 2026 Currency Counter Maker. All rights reserved.
