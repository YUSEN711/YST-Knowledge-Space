# YST Knowledge Space

A React application built with Vite, TypeScript, and Tailwind CSS (planned).

## Getting Started

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd YST-Knowledge-Space
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Start the development server:**
    ```bash
    npm run dev
    ```

## Scripts

-   `npm run dev`: Starts the development server.
-   `npm run build`: Builds the application for production.
-   `npm run preview`: Previews the production build locally.
-   `npm run lint`: Runs ESLint to check for code quality issues.
-   `npm run format`: Formats code using Prettier.
-   `npm run deploy`: Manually deploys the application to GitHub Pages.

## Deployment

### Automated Deployment (Recommended)

This project is configured with GitHub Actions to automatically deploy to GitHub Pages whenever changes are pushed to the `main` branch.

1.  Ensure your repository is on GitHub.
2.  Go to **Settings** > **Pages**.
3.  Under **Build and deployment** > **Source**, select **GitHub Actions**.
4.  Push your changes to `main`. The `Deploy to GitHub Pages` workflow will run automatically.

### Manual Deployment

To manually deploy to GitHub Pages:

```bash
npm run deploy
```

## Contributing

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/your-feature`).
3.  Commit your changes.
4.  Push to the branch.
5.  Open a Pull Request.
