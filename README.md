# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs["recommended-typescript"],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

## Using Ollama Desktop (local Ollama app)

If you installed the Ollama desktop application and want the OneFlow server to use it as the LLM backend, follow these steps:

- **Start the Ollama app**: Launch the Ollama Desktop application and ensure it is running. By default Ollama exposes an HTTP API on `http://localhost:11434`.
- **Install or pull a model**: In Ollama, make sure you have a model available (for example `phi4`). You can install models via the Ollama UI or CLI.
- **Configure environment**: Copy `.env.example` to `.env` and adjust values if needed, for example:

```fish
cp .env.example .env
# then edit .env to match your model or port
```

- **Set environment variables directly** (optional):

```fish
set -x LLM_BASE_URL http://localhost:11434
set -x LLM_MODEL phi4
npm run server
```

- **Verify connection**: After starting the server (`npm run server`), you can verify the server can reach Ollama by calling the health endpoint:

```fish
curl http://localhost:4040/api/llm/health
```

The endpoint returns `ok: true` and a list of available models when successful.

If you prefer a different base URL or port, set `LLM_BASE_URL` accordingly.
