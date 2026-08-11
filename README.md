# PolicyEngine UK Chat interactive article

A standalone interactive version of PolicyEngine's “AI chatbot for policymaking” article.

The repository reconstructs the source structure of PolicyEngine's interactive “Automating Tax and Benefit Policy Modeling with Multi-Agent AI” article. That article's React source was not committed to `policyengine-app-v2`; only its production bundle and stylesheet were retained. This project therefore:

- preserves the original article's scrollytelling structure and exact committed stylesheet;
- restores the implementation as maintainable React source;
- replaces the original narrative, interactive data, and diagrams with the current UK Chat article;
- keeps the current Markdown article in `content/current-article.md` as the canonical editorial reference.

## Development

```bash
bun install
bun run dev
```

## Production build

```bash
bun run build
```

The Vite build uses relative asset URLs so `dist/` can later be copied beneath a static path in `policyengine-app-v2`.
