# 🌱 AgroBot

Assistente de agronomia com IA para o campo brasileiro. O AgroBot responde dúvidas técnicas sobre solo, fitossanidade, irrigação e adubação, analisa fotos da lavoura e gera laudos em PDF e Word, com o histórico de cada consulta salvo na conta do usuário.

> 🔗 **Demo:** _adicione aqui a URL do deploy no Railway_
>
> 📸 _adicione aqui um print ou GIF do chat (ex.: `docs/demo.gif`)_

---

## Funcionalidades

- **Chat com IA em tempo real** (streaming via SSE) especializado em agronomia tropical, com fallback automático de modelo quando o Groq atinge o limite de uso.
- **Análise de imagens**: envio de até 4 fotos (JPEG, PNG ou WebP) por mensagem.
- **Histórico de conversas** salvo no PostgreSQL, isolado por usuário.
- **Exportação** da resposta em laudo PDF ou Word, e da conversa inteira em `.txt`/`.md`.
- **Contas** com cadastro por e-mail (código de confirmação via Brevo) ou login com Google.
- **Preferências** de idioma (português, inglês ou espanhol) e de tamanho das respostas.

## Stack

| Camada | Tecnologias |
|---|---|
| Frontend | React 19, Vite, React Router, marked + DOMPurify, jsPDF (carregado sob demanda) |
| Backend | FastAPI, asyncpg, PyJWT, bcrypt, httpx |
| Banco | PostgreSQL |
| Serviços | Groq (LLM), Brevo (e-mail transacional), Google Identity Services (OAuth) |
| Deploy | Railway (Nixpacks), health check em `/health` |

## Arquitetura

```
 Navegador (React + Vite)
   │  JWT no header Authorization
   ▼
 FastAPI ──────────────► PostgreSQL
   │  users · conversations · messages · sessions · email_verifications
   ├──► Groq API        (chat em streaming; system prompt montado no servidor)
   ├──► Brevo API       (código de verificação por e-mail)
   └──► Google OAuth    (troca do authorization code por tokens)
```

```
AGROBOT/
├── backend/
│   ├── app/
│   │   ├── main.py            # app FastAPI, CORS e cabeçalhos de segurança
│   │   ├── database.py        # pool asyncpg + criação/migração das tabelas
│   │   ├── auth_utils.py      # JWT e bcrypt
│   │   ├── dependencies.py    # require_auth (sessões) e rate limiter
│   │   ├── email_service.py   # envio via Brevo
│   │   └── routes/            # auth, chat, conversations
│   └── tests/                 # pytest
├── frontend/
│   └── src/
│       ├── api/               # cliente HTTP, sessão e streaming do chat
│       ├── components/        # chat/, landing/, modals/
│       ├── hooks/             # useToast
│       ├── utils/             # markdown, exportação PDF/Word, preferências
│       └── pages/             # Landing, Chat, Privacy
└── docs/                      # deploy e segurança
```

## Como rodar localmente

**Pré-requisitos:** Python 3.12+, Node 20+ e um PostgreSQL local.

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate            # Windows  (Linux/macOS: source venv/bin/activate)
pip install -r requirements-dev.txt
cp .env.example .env             # preencha as variáveis abaixo
uvicorn app.main:app --reload    # http://localhost:8000  (Swagger em /docs)
```

As tabelas são criadas automaticamente na primeira inicialização. Sem `BREVO_API_KEY`, o código de verificação aparece no terminal (somente fora de produção).

### Frontend

```bash
cd frontend
npm install
npm run dev                      # http://localhost:5173 (o Vite redireciona /api para o backend)
```

### Testes

```bash
cd backend
# Use um banco SEPARADO: os testes apagam todos os dados dele a cada execução
set TEST_DATABASE_URL=postgresql://postgres:senha@localhost:5432/agrobot_test
pytest
```

Sem `TEST_DATABASE_URL`, só os testes unitários rodam. Para checar o frontend: `npm run lint` e `npm run build`.

## Variáveis de ambiente

**Backend (`backend/.env`)**

| Variável | Obrigatória | Descrição |
|---|---|---|
| `DATABASE_URL` | ✅ | Conexão PostgreSQL |
| `JWT_SECRET` | ✅ | Segredo dos tokens (32+ caracteres em produção) |
| `GROQ_API_KEY` | ✅ | Chave da API do Groq |
| `ENV` | | `development` (padrão) ou `production` |
| `ALLOWED_ORIGINS` | | Origens do frontend liberadas no CORS, separadas por vírgula |
| `DB_SSL` | | `auto` (padrão), `require` ou `disable` |
| `GROQ_MODEL` / `GROQ_MODEL_VISION` | | Modelos do Groq para texto e imagem |
| `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME` | | Envio do código de verificação |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | | Login com Google (os dois são necessários) |

**Frontend**

| Variável | Descrição |
|---|---|
| `VITE_API_URL` | URL pública do backend. Vazia em desenvolvimento (usa o proxy do Vite). Também entra na Content-Security-Policy do build. |

## Deploy

O passo a passo para o Railway (banco, backend e frontend) está em [docs/DEPLOY_RAILWAY.md](docs/DEPLOY_RAILWAY.md).

## Decisões técnicas

- **System prompt no servidor**: o cliente envia só o idioma, então ninguém usa a chave do Groq como um "proxy livre" para outros assuntos.
- **Login Google com authorization code**: o código só é trocado com o `client_secret` do AgroBot, o que impede o uso de tokens emitidos para outros sites.
- **Sessões revogáveis**: cada JWT tem um `jti` salvo em `sessions`. O logout apaga a sessão e o token deixa de valer na hora.
- **Recadastro seguro**: a senha nova de uma conta ainda não confirmada só vale depois que o código enviado ao e-mail é confirmado.
- **Imagens só na mensagem atual**: fotos antigas viram um marcador de texto no histórico e não são reenviadas a cada pergunta.
- **Markdown com marked + DOMPurify**: gera HTML válido e sanitizado, sem mexer em valores como "R$ 150".

Detalhes de segurança em [docs/SECURITY_AUDIT.md](docs/SECURITY_AUDIT.md).

## Limitações conhecidas

- O rate limiter fica em memória: zera a cada reinício e não é compartilhado entre instâncias (a solução seria Redis).
- As fotos enviadas não são salvas no histórico, só o texto da conversa.
- As migrações rodam no startup com `ADD COLUMN IF NOT EXISTS`. Se o schema crescer, vale adotar o Alembic.
- O AgroBot é uma ferramenta de apoio: as recomendações não substituem o receituário agronômico de um profissional habilitado.
