# 🚀 Guia Passo a Passo: Hospedagem do AgroBot no Railway

Este documento contém o passo a passo completo para hospedar a aplicação **AgroBot** (Backend FastAPI, Frontend React/Vite e Banco de Dados PostgreSQL) na plataforma [Railway](https://railway.app/).

---

## 📋 Arquitetura no Railway

O projeto será composto por 3 serviços dentro de um único projeto no Railway:
1. **PostgreSQL Database**: Banco de dados relacional gerenciado pelo próprio Railway.
2. **Backend (FastAPI)**: API Python que se conecta ao PostgreSQL e consome a API do Groq e Brevo.
3. **Frontend (React + Vite)**: Aplicação SPA servida para os usuários.

---

## ⚙️ Pré-requisitos

1. Conta criada no [Railway](https://railway.app/).
2. Código do projeto enviado para um repositório no **GitHub** (pode ser público ou privado).
3. Chaves de API prontas:
   - **Groq API Key**: Obtida em [console.groq.com](https://console.groq.com).
   - **Brevo API Key**: Obtida no painel da [Brevo](https://www.brevo.com/) (para e-mails de confirmação).
   - **Google Client ID** *(opcional)*: Para autenticação via Google OAuth.

---

## Passo 1: Criar o Projeto e o Banco PostgreSQL

1. Acesse o painel do **Railway** e clique em **"New Project"**.
2. Selecione **"Provision PostgreSQL"**.
3. O Railway criará uma instância do PostgreSQL em instantes.
4. Clique no card do banco criado e vá na aba **"Variables"**:
   - O Railway já disponibiliza a variável `${{Postgres.DATABASE_URL}}` automaticamente para os outros serviços.

---

## Passo 2: Configurar e Fazer Deploy do Backend

1. Dentro do mesmo projeto no Railway, clique em **"+ New"** (ou aperte `Ctrl + K` / `Cmd + K`) e selecione **"GitHub Repo"**.
2. Selecione o repositório do **AgroBot**.
3. Clique no serviço recém-adicionado e acerte as configurações na aba **"Settings"**:
   - **Root Directory**: altere para `/backend`.
   - Em **Networking**: clique em **"Generate Domain"** para criar uma URL pública (exemplo: `https://agrobot-backend-production.up.railway.app`).
4. Vá para a aba **"Variables"** do Backend e configure as seguintes variáveis:

| Variável | Valor sugerido / Origem |
| :--- | :--- |
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` *(selecione a referência ao banco)* |
| `JWT_SECRET` | Uma string secreta forte e aleatória (ex: gere 64 caracteres) |
| `GROQ_API_KEY` | Sua chave de API do Groq |
| `BREVO_API_KEY` | Sua chave de API do Brevo |
| `BREVO_SENDER_EMAIL` | E-mail remetente verificado no Brevo |
| `BREVO_SENDER_NAME` | `AgroBot` |
| `GOOGLE_CLIENT_ID` | Seu Client ID do Google *(opcional)* |
| `ENV` | `production` |
| `ALLOWED_ORIGINS` | `http://localhost:5173` *(atualizaremos no Passo 4 com a URL final do frontend)* |

> ℹ️ **Nota:** O arquivo `railway.toml` já configurado na pasta `/backend` instruirá o Railway a usar o Nixpacks com o comando `uvicorn app.main:app --host 0.0.0.0 --port $PORT` e o health check em `/health`.
> 
> As tabelas do banco de dados são criadas automaticamente na primeira inicialização da aplicação (`init_db()`).

---

## Passo 3: Configurar e Fazer Deploy do Frontend

1. No mesmo projeto, clique novamente em **"+ New"** -> **"GitHub Repo"** e selecione o mesmo repositório do AgroBot.
2. Clique no card do novo serviço e vá na aba **"Settings"**:
   - **Service Name**: Renomeie para `frontend` (para organizar).
   - **Root Directory**: altere para `/frontend`.
   - **Build Command**: `npm run build`
   - **Start Command**: `npx serve -s dist -l $PORT`
   - Em **Networking**: clique em **"Generate Domain"** para gerar a URL pública do seu app (exemplo: `https://agrobot-web-production.up.railway.app`).
3. Vá para a aba **"Variables"** do serviço do Frontend e adicione:

| Variável | Valor |
| :--- | :--- |
| `VITE_API_URL` | A URL pública gerada no Backend (ex: `https://agrobot-backend-production.up.railway.app`) |

> ⚠️ **Atenção:** Como o Vite injeta variáveis `VITE_*` durante a fase de build, qualquer alteração na variável `VITE_API_URL` exige um novo deploy (trigger deploy) no Frontend para fazer efeito.

---

## Passo 4: Conectar Frontend ao Backend (CORS)

Para que o frontend possa se comunicar com o backend sem erros de bloqueio de requisição (CORS):

1. Copie a URL pública gerada para o **Frontend** no Passo 3 (ex: `https://agrobot-web-production.up.railway.app`).
2. Volte ao serviço do **Backend**, vá na aba **"Variables"**.
3. Atualize a variável `ALLOWED_ORIGINS` incluindo a URL do Frontend (separadas por vírgula se houver mais de uma):
   ```env
   ALLOWED_ORIGINS=https://agrobot-web-production.up.railway.app,http://localhost:5173
   ```
4. O backend reiniciará automaticamente aplicando as novas origens permitidas.

---

## Passo 5: Testes e Validação

1. Abra a URL pública do Backend no navegador e teste o endpoint de status:
   - `https://SEU-BACKEND.up.railway.app/health` ➔ deve responder `{"status":"healthy"}`
   - `https://SEU-BACKEND.up.railway.app/` ➔ deve responder `{"status":"online", ...}`
2. Abra a URL pública do Frontend:
   - Faça o cadastro de um novo usuário.
   - Verifique o recebimento do código por e-mail (Brevo).
   - Valide o login e teste enviar uma mensagem no chat (Groq).
   - Gere um relatório em PDF no chat para confirmar que todas as rotas estão operacionais.

---

## 🛠️ Resumo de Troubleshooting

- **Erro de CORS no console do navegador (`Cross-Origin Request Blocked`)**:
  - Verifique se a URL do frontend na variável `ALLOWED_ORIGINS` do backend está sem barra `/` no final.
- **Frontend não encontra a API (`Failed to fetch` ou chamando `localhost`)**:
  - Verifique se a variável `VITE_API_URL` no serviço do frontend está preenchida corretamente com o protocolo `https://`.
  - Faça um **Redeploy** do frontend após alterar a variável.
- **Backend não conecta ao banco**:
  - Certifique-se de que a variável `DATABASE_URL` no backend está apontando para a variável de conexão do Railway (`${{Postgres.DATABASE_URL}}`).
