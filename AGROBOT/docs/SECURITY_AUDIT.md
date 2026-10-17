# Segurança do AgroBot

**Última revisão:** 17 de outubro de 2026
**Escopo:** backend (FastAPI, PostgreSQL/asyncpg, JWT, Groq, Brevo, Google OAuth) e frontend (React + Vite)

Este documento descreve as proteções que **existem no código hoje**, onde ficam e o que ainda é limitação conhecida. Os itens marcados com 🧪 têm teste automatizado em `backend/tests/`.

---

## 1. Autenticação e contas

| ID | Proteção | Onde |
|---|---|---|
| SEC-01 | Senhas com **bcrypt** (limite de 72 bytes tratado), mínimo de 8 e máximo de 128 caracteres | `app/auth_utils.py`, `routes/auth.py` |
| SEC-02 | **Login com mensagem genérica** ("E-mail ou senha incorretos") | `routes/auth.py` → `login` |
| SEC-03 | Código de verificação de 6 dígitos gerado com `secrets`, expira em 15 min e é **invalidado após 5 tentativas** | `email_service.py`, `routes/auth.py` → `verify_email` |
| SEC-04 | **Recadastro não troca a senha** de conta não confirmada: nome/senha novos ficam pendentes no código e só valem após a confirmação 🧪 | `routes/auth.py` → `register` |
| SEC-05 | **Login Google descarta a senha** de uma conta pré-cadastrada e nunca confirmada (impede o roubo de conta por pré-cadastro) 🧪 | `routes/auth.py` → `_upsert_google_user_and_token` |
| SEC-06 | Login Google só pelo fluxo **authorization code** (troca feita com o `client_secret`); o `id_token` precisa ter `aud` = nosso Client ID e `email_verified = true`. Tokens emitidos para outros sites são recusados 🧪 | `routes/auth.py` → `google_auth_code` |
| SEC-07 | **Sem enumeração de e-mails**: `/register` e `/send-verification` respondem igual para e-mails existentes e inexistentes 🧪 | `routes/auth.py` |
| SEC-08 | **Logout real**: cada JWT tem um `jti` registrado na tabela `sessions`; `require_auth` exige a sessão ativa e o logout a apaga 🧪 | `dependencies.py`, `routes/auth.py` → `logout` |
| SEC-09 | `JWT_SECRET` obrigatório, com no mínimo 32 caracteres em produção; tokens expiram em 7 dias; biblioteca **PyJWT** | `auth_utils.py` |
| SEC-10 | Em produção, o código de verificação **nunca** é escrito no log | `email_service.py` |

## 2. Autorização e dados

| ID | Proteção | Onde |
|---|---|---|
| SEC-11 | Todas as consultas SQL são **parametrizadas** (`$1`, `$2`…) | todo o backend |
| SEC-12 | Toda rota de conversa filtra por `user_id`: ninguém lê ou apaga conversa alheia | `routes/conversations.py` |
| SEC-13 | IDs de conversa tipados como `UUID` (ID inválido → 422, não 500) 🧪 | `routes/conversations.py` |
| SEC-14 | Campo `plan` (plano de assinatura) **não é editável** pelo usuário; a profissão tem coluna própria (`profession`) 🧪 | `routes/auth.py` → `update_me` |
| SEC-15 | Limites de tamanho: título até 120 caracteres, mensagem salva até 15.000, mensagem enviada à IA até 8.000 | `routes/conversations.py`, `routes/chat.py` |

## 3. Uso da IA (custo e abuso)

| ID | Proteção | Onde |
|---|---|---|
| SEC-16 | **System prompt montado só no servidor**; o cliente envia apenas o idioma. Campo `system` vindo do cliente é ignorado 🧪 | `routes/chat.py` → `build_system_prompt` |
| SEC-17 | Mensagens validadas com Pydantic: `role` só aceita `user`/`assistant`; payload malformado → 422 🧪 | `routes/chat.py` → `ChatMessage` |
| SEC-18 | Imagens: só JPEG/PNG/WebP em base64 (sem URLs externas), até 4 por mensagem e ~7 MB cada; só a última mensagem leva imagens 🧪 | `routes/chat.py` |
| SEC-19 | Rate limit de 15 requisições/min por usuário no chat | `routes/chat.py` |
| SEC-20 | Erros do Groq padronizados (sem detalhes internos); raciocínio interno do modelo (`reasoning`, `<think>`) não é repassado 🧪 | `routes/chat.py` |

## 4. Rede, cabeçalhos e frontend

| ID | Proteção | Onde |
|---|---|---|
| SEC-21 | Rate limit por IP em login, cadastro, verificação e Google. O IP vem do **último** valor de `X-Forwarded-For` (o que o proxy acrescentou), que o cliente não consegue forjar 🧪 | `dependencies.py` → `get_client_ip` |
| SEC-22 | CORS restrito a `ALLOWED_ORIGINS` (sem `*`) | `main.py` |
| SEC-23 | Cabeçalhos na API: `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, HSTS (produção) e `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'` | `main.py` |
| SEC-24 | **CSP no frontend**: injetada no `index.html` do build de produção, liberando só a própria origem, a API (`VITE_API_URL`), o Google Identity Services e o Google Fonts | `frontend/vite.config.js` |
| SEC-25 | Markdown da IA renderizado com `marked` e **sanitizado com DOMPurify**; mensagens de erro escapadas antes de virar HTML | `frontend/src/utils/markdown.js`, `pages/Chat.jsx` |
| SEC-26 | Exportação Word escapa título e conteúdo antes de montar o HTML | `frontend/src/utils/exportWord.js` |
| SEC-27 | Swagger/ReDoc desligados em produção | `main.py` |

---

## 5. Limitações conhecidas

- **Rate limiter em memória**: zera a cada reinício e não é compartilhado entre instâncias. Para escalar horizontalmente, use Redis.
- **Token no `localStorage`**: um XSS conseguiria lê-lo. A CSP e o DOMPurify reduzem esse risco, e o logout revoga o token no servidor. A alternativa mais forte seria um cookie `HttpOnly` + proteção CSRF.
- **CSP com `style-src 'unsafe-inline'`**: necessário porque o React aplica estilos inline. Scripts inline continuam bloqueados.
- **Imagens não são persistidas**: só o texto da conversa é salvo; o usuário é avisado ao enviar fotos.
- **Migrações no startup** (`init_db`): funcionam com `ADD COLUMN IF NOT EXISTS`, mas, se o schema crescer, vale migrar para Alembic.

---

## 6. Checklist pré-deploy

- [ ] `ENV=production`
- [ ] `JWT_SECRET` aleatório com 32+ caracteres
- [ ] `DATABASE_URL` (e `DB_SSL`, se a conexão não usar SSL)
- [ ] `GROQ_API_KEY` e nome do modelo em `GROQ_MODEL` conferido no console do Groq
- [ ] `BREVO_API_KEY` e remetente verificado
- [ ] `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`, com a URL do frontend nas origens autorizadas
- [ ] `ALLOWED_ORIGINS` com a URL real do frontend
- [ ] `VITE_API_URL` no build do frontend (também entra na CSP)
- [ ] `pip-audit` sem vulnerabilidades e `pytest` passando
