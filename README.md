# PolicyEngine UK Chat interactive article

A standalone interactive version of “PolicyEngine UK Chat: an AI interface for tax and benefits”.

The presentation structure is adapted from PolicyEngine's interactive “Automating Tax and Benefit Policy Modeling
with Multi-Agent AI” article. Its original, editable React source is the
[`scrolly-blog`](https://github.com/PolicyEngine/agentic-workflow-presentation/tree/main/scrolly-blog) app in
[`PolicyEngine/agentic-workflow-presentation`](https://github.com/PolicyEngine/agentic-workflow-presentation).
`policyengine-app-v2` separately retains a compiled copy of that older article for production. This project:

- adapts the original article's scrollytelling structure and committed production stylesheet;
- keeps the new implementation as maintainable React source;
- replaces the original narrative, interactive data, and diagrams with the current UK Chat article;
- keeps a Markdown copy of the article prose in `content/current-article.md` for editorial review. The
  page in `src/` is canonical; regenerate the Markdown when the prose changes rather than editing both.

The exact production files committed for the older article are preserved byte-for-byte in
`reference/encode-policy-original/`. They are reference artefacts, not the editable source of this app.

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

## Checks

```bash
bun run check
```

## Licence

[MIT](./LICENSE) © 2026 PolicyEngine
