# AgroBot — Frontend

SPA em React 19 + Vite. A visão geral do projeto, as variáveis de ambiente e as instruções completas estão no [README da raiz](../README.md).

```bash
npm install
npm run dev      # http://localhost:5173 — /api é redirecionado para http://localhost:8000
npm run lint     # oxlint
npm run build    # gera dist/ com a Content-Security-Policy de produção
```

| Pasta | Conteúdo |
|---|---|
| `src/api/` | cliente HTTP, sessão (token) e streaming SSE do chat |
| `src/components/chat/` | sidebar, barra superior, mensagens, composer e tela inicial |
| `src/components/landing/` | modal de autenticação, ícones e conteúdo da landing |
| `src/components/modals/` | perfil e configurações do assistente |
| `src/utils/` | Markdown (marked + DOMPurify), exportação PDF/Word, preferências |
| `src/pages/` | `Landing`, `Chat` e `Privacy` |
