# Historic Places Canada 2

**The Open Source Rescue of Canada's Digital Heritage.**

In 2026, Parks Canada announced the shutdown of `HistoricPlaces.ca`, putting an invaluable database of over 11,000 historic sites at risk of disappearing. **Historic Places Canada 2** is the community response: a modern, open-source platform built to rescue, preserve, and revitalize this irreplaceable cultural knowledge for future generations.

We rebuilt the entire experience from the ground up to be faster, more beautiful, and easier to explore.

## 🍁 What is this?

This is a full-stack preservation platform that serves:

1.  **A Modern Web Application**: A lightning-fast, responsive SPA (Single Page Application) that makes exploring history a premium experience.
2.  **A Public API**: A robust backend that powers the site and provides open access to the data for researchers and developers.
3.  **The Complete Dataset**: We've cleaned and indexed the original data, including descriptions, architectural details, and images.

**[Explore the Live Site](https://historicplaces2.ca/)**

## ✨ Features

We've implemented features that modern users expect:

*   **🔍 Advanced Search**: Filter 10,000+ places by **Architect**, **Year of Construction**, **Theme**, **Municipality**, and more. No more clunky government forms.
*   **🗺️ Interactive Map**: visualize historic sites across all 13 provinces and territories on a performant, clustering map.
*   **🗣️ Fully Bilingual**: Native support for **English** and **French**, just like the original, but faster.
*   **📱 Mobile First**: A responsive design that looks great on your phone, tablet, or desktop.
*   **🔓 Open Data**: The entire database is available for download. We believe history belongs to everyone.

## 🛠️ Tech Stack

Built on the Edge for speed and reliability:

*   **Frontend**: React + Vite (Static SPA)
*   **Backend**: Cloudflare Workers (Edge API)
*   **Database**: Cloudflare D1 (SQLite at the Edge)
*   **Storage**: Cloudflare R2 (Images)
*   **Language**: TypeScript throughout

## 🚀 Running Locally

Want to help improve the site? Here is how to get the full stack running on your machine:

1.  **Clone the Repo**
    ```bash
    git clone https://github.com/gorskiz/historic-canada-api.git
    cd historic-canada-api
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Start Development Server**
    ```bash
    npm run dev
    ```
    This command starts the Cloudflare Worker emulator (Wrangler) which serves both the API and the React frontend.

    *   Web App: `http://localhost:8787`
    *   API: `http://localhost:8787/api/*`

## 🤝 Contributing

This is a **community-led** project. We need your help to keep it alive and growing.

*   **Developers**: We need help with Map UI improvements, search optimizations, and accessibility fixes.
*   **Designers**: Help us make the history look as good as it sounds.
*   **Data Sleuths**: Found a duplicate? A missing image? Let us know.

**How to contribute:**
1.  Check the **Issues** tab for tasks.
2.  Fork the repo and create your branch (`git checkout -b feature/amazing-feature`).
3.  Submit a Pull Request.

## 📜 License

This project is open source. Data originally sourced from the Canadian Register of Historic Places. (https://www.historicplaces.ca/)

---
*Preserving the past, building for the future.*
