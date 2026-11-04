# 🪙 Currency Counter

> **Professional Offline Cash Denomination Counter & Institutional Financial Calculators Suite supporting 47+ Global Currencies.**

---

### ⚠️ Legal Notice & Anti-Reverse Engineering Protection
> **Written permission is strictly required from the maker for every personal and professional use of this project and its contents.**
>
> All intellectual property, algorithms, dataset configurations, designs, and source code are strictly proprietary.
> - **No Unauthorized Use**: Personal, commercial, educational, or professional use without prior written consent from the maker is prohibited.
> - **Anti-Reverse Engineering**: Decompiling, reverse engineering, disassembling, cloning, scraping, or creating derivative works from this repository, its assets, or its deployed bundles is strictly forbidden under applicable intellectual property laws.
> - Refer to the [LICENSE](./LICENSE) for full proprietary terms.

---

## 📌 Project Overview

**Currency Counter** is a high-precision, offline-first financial utility and cash reconciliation platform built for banking institutions, retail cashiers, corporate accountants, treasury teams, currency exchange desks, and international travelers. 

It streamlines daily cash handling by automatically calculating total currency value, piece counts, and denomination breakdowns in real time, accompanied by automatic amount-in-words conversion in both Indian and International numbering conventions. In addition to denomination tallying, the application integrates four institutional financial calculators and live/offline multi-currency exchange conversion.

---

## 🌟 Core Features & Modules

### 1. 💵 Cash Denomination Counter
* **Real-Time Note & Coin Tallying**: Interactive counter with instant total recalculation and quick-fill bundle triggers (+10, +50, +100).
* **Dual Numbering Systems**:
  * **Indian Numbering Format**: Formats totals in Lakhs and Crores with precise words conversion (e.g., *₹1,25,000 – One Lakh Twenty Five Thousand Rupees*).
  * **International Numbering Format**: Formats totals in Millions and Billions with fractional sub-units (e.g., *$1,250,000 – One Million Two Hundred Fifty Thousand Dollars*).
* **Custom Denomination Engine**: Allows cashiers to inject custom bills, token currencies, or commemorative values.
* **Denomination Status Categorization**: Supports active *Circulation*, *Rare collector*, and *Delisted* banknotes.
* **Professional Slip Printing & Export**: One-tap generation of cash deposit and shift-closing slips formatted with employee name, badge ID, department, timestamps, and denomination tallies.

### 2. 🧮 Institutional Financial Calculators
* **Fixed Deposit (FD) Calculator**:
  * Calculates Simple and Compound Interest maturities.
  * Configurable compounding periods: Monthly, Quarterly, Half-Yearly, and Annually.
  * Visualizes invested principal against accumulated interest returns.
* **SIP (Systematic Investment Plan) Wealth Calculator**:
  * Projects long-term wealth compounding for recurring mutual funds and investment portfolios.
  * Computes total capital deployed, estimated returns, and final maturity corpus.
* **Recurring Deposit (RD) Calculator**:
  * Computes maturity valuations and yield for term recurring bank deposits.
* **Loan EMI Calculator**:
  * Calculates monthly Equated Monthly Installments (EMI) for commercial loans, mortgages, home loans, and auto financing.
  * Delivers comprehensive interest-to-principal distribution metrics.

### 3. 💱 Global Currency Converter
* Instant exchange conversions between 47+ recognized world currencies.
* Hybrid operation: operates with live market rates when connected and automatically switches to pre-cached offline exchange rates when disconnected.

### 4. 🌍 Interactive 3D Earth Globe
* Rendered with **Three.js** using NASA Earth surface textures and atmospheric limb shading.
* Interactive country navigation with spherical coordinate projection (`lat/lng` to 3D Cartesian coordinates) and smooth camera transitions.

### 5. 🏢 Cashier & Department Reconciliation
* Segregates financial tallies across operational departments (Accounts & Finance, Retail, Treasury, Front Desk).
* Multi-teller shift reconciliation and audit logging stored securely on the local device.

### 6. 📱 100% Offline Progressive Web App (PWA)
* Fully functional without any internet connectivity.
* Zero data latency, instant startup, and installable on iOS, Android, macOS, and Windows.

### 7. 🛡️ Enterprise Security & Hardening
* **Server-Side Security Shield**: Defense against prototype pollution, path traversal attacks, and malformed inputs.
* **Zero Client Secret Exposure**: No API keys, credentials, or administrative secrets are ever exposed in client-side code or browser bundles.
* **Anti-Scraping & Rate Limiting**: Built-in memory rate limiters safeguard server-side endpoints against abusive scraping and automated spam.
* **Strict Content-Security-Policy (CSP)**: Comprehensive CSP headers preventing XSS, clickjacking, and unauthorized third-party script execution.

---

## 🌐 Supported Countries & Currencies (47+ Nations)

Currency Counter maintains complete denomination matrices (banknotes and coins) for:

| Continent | Countries & Supported Currencies |
| :--- | :--- |
| **Asia** | Bharat / India (`INR`), China (`CNY`), Japan (`JPY`), South Korea (`KRW`), Singapore (`SGD`), Malaysia (`MYR`), Indonesia (`IDR`), Vietnam (`VND`), Thailand (`THB`), Philippines (`PHP`), Bangladesh (`BDT`), Pakistan (`PKR`), Sri Lanka (`LKR`), Nepal (`NPR`), Hong Kong (`HKD`) |
| **Europe** | Eurozone 19+ Countries (`EUR`), United Kingdom (`GBP`), Switzerland (`CHF`), Norway (`NOK`), Sweden (`SEK`), Denmark (`DKK`), Poland (`PLN`), Russia (`RUB`), Turkey (`TRY`) |
| **Middle East** | United Arab Emirates (`AED`), Saudi Arabia (`SAR`), Qatar (`QAR`), Kuwait (`KWD`), Oman (`OMR`), Bahrain (`BHD`), Israel (`ILS`) |
| **Americas** | United States (`USD`), Canada (`CAD`), Mexico (`MXN`), Brazil (`BRL`), Argentina (`ARS`), Colombia (`COP`) |
| **Africa** | South Africa (`ZAR`), Nigeria (`NGN`), Egypt (`EGP`), Kenya (`KES`), Cameroon (`XAF`), Gabon (`XAF`), Côte d'Ivoire (`XOF`), Senegal (`XOF`) |
| **Oceania** | Australia (`AUD`), New Zealand (`NZD`) |

---

## 🏗️ Architecture & Technology Stack

* **Client Layer**:
  * React 19 (Functional architecture & hooks)
  * TypeScript (Strict type system)
  * Tailwind CSS v4 (Modern responsive utility system)
  * Lucide Icons (Vector UI glyphs)
  * Three.js (WebGL 3D surface mapping)
* **Server & Routing**:
  * Node.js & Express
  * Gzip & Deflate payload compression
  * In-memory token-bucket rate limiters
* **Production Packaging**:
  * Multi-layer code minification, identifier mangling, and comment stripping
  * Non-revealing hashed chunk naming to impede structural analysis

---

## 🔒 Data Privacy Commitment

* **Local Data Sovereignty**: All cash tallies, notes breakdowns, and financial computations remain strictly on the client device.
* **No User Tracking**: The application does not collect, track, or share any personal identity, financial balances, or device records.

---

## 📜 Written Permission & Licensing Inquiries

As stipulated in the [LICENSE](./LICENSE), **written permission from the maker is strictly required for every personal and professional use of this project and its contents.**

To request written permission, commercial licensing, or institutional deployment authorization, please reach out via official repository communications (GitHub Issues or Discussions).

---

© 2026 Currency Counter Maker. All rights reserved.
