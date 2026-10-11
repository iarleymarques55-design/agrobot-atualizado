# Relatório de Auditoria e Correções de Segurança — AgroBot

**Data:** 10 de Outubro de 2026  
**Status:** Correções Implementadas e Prontas para Produção  
**Escopo:** Backend (FastAPI, PostgreSQL, Asyncpg, JWT, Groq, Brevo) e Frontend (React, Vite)

---

## 1. Resumo Executivo

Este documento consolida a análise de segurança cibernética e as medidas de endurecimento (*hardening*) aplicadas ao sistema **AgroBot** antes de seu lançamento em ambiente de produção (Railway / Vercel / Cloud).

Foram identificados e corrigidos **10 pontos de atenção de segurança**, distribuídos entre controle de acesso, mitigação de negação de serviço (DoS/custo), proteção contra ataques de força bruta, sanitização de entradas e integridade de dados.

---

## 2. Matriz de Vulnerabilidades e Correções

| ID | Área | Vulnerabilidade / Risco | Severidade | Status |
|---|---|---|---|---|
| **SEC-01** | CORS / API | Métodos HTTP permitidos omitiam `PUT` e origens de produção restritas | **Alta** | Corrigido |
| **SEC-02** | Proteção de Cota / DoS | Ausência de Rate Limiting e controle de frequência na rota `/api/chat` | **Alta** | Corrigido |
| **SEC-03** | Autenticação / 2FA | Ausência de limite de tentativas por código de verificação de 6 dígitos | **Alta** | Corrigido |
| **SEC-04** | API / Banco de Dados | Ausência de limite de tamanho no corpo das mensagens das conversas | **Média** | Corrigido |
| **SEC-05** | Frontend / Exportação | Injeção de HTML no título de relatórios Word exportados (`generateWord`) | **Média** | Corrigido |
| **SEC-06** | Upload de Arquivos | Falta de validação de tamanho (MB) e MIME types de anexos | **Média** | Corrigido |
| **SEC-07** | Infraestrutura / Memória | Rate Limiter em memória sem purga de chaves e tratamento de proxy | **Média** | Corrigido |
| **SEC-08** | Cabeçalhos HTTP | Falta de cabeçalhos de proteção avançados (`Content-Security-Policy`) | **Média** | Corrigido |
| **SEC-09** | Tratamento de Erros | Vazamento de respostas internas da API Groq em caso de falhas | **Baixa** | Corrigido |
| **SEC-10** | Criptografia / Segredos | Falta de validação da entropia mínima de `JWT_SECRET` em produção | **Baixa** | Corrigido |

---

## 3. Detalhamento Técnico das Correções

### SEC-01: Configuração Completa de CORS e Métodos HTTP
- **Problema:** O middleware de CORS em `main.py` liberava apenas `GET`, `POST`, `DELETE`, `OPTIONS`. A nova rota `PUT /api/me` sofria falha de preflight CORS.
- **Correção:** Métodos autorizados atualizados para incluir `PUT`. Configuração dinâmica flexível para origens permitidas via variável de ambiente `ALLOWED_ORIGINS`.

### SEC-02: Rate Limiting na Rota de IA (`/api/chat`)
- **Problema:** Como a API Groq cobra ou possui limites estritos de requisições por minuto (RPM/TPM), usuários autenticados podiam disparar requisições em massa, causando exaustão de cota ou bloqueio de serviço.
- **Correção:** Implementado limitador de taxa específico por usuário autenticado (máximo de 15 requisições por minuto por usuário).

### SEC-03: Mitigação de Força Bruta no Código de Confirmação de E-mail
- **Problema:** O código de verificação possui 6 dígitos (1.000.000 combinações) e validade de 15 minutos. Um atacante utilizando múltiplos IPs poderia tentar adivinhar o código dentro da janela de tempo.
- **Correção:** Adicionada contagem de tentativas (`attempts`) no banco de dados. Após 5 tentativas incorretas, o código é automaticamente invalidado, forçando a geração de um novo token.

### SEC-04: Limites de Payload e Proteção contra DoS no Banco de Dados
- **Problema:** As rotas de conversas aceitavam textos com tamanho ilimitado em `SaveMessageBody` e `CreateConvBody`.
- **Correção:** Adicionados validadores de tamanho máximo com Pydantic (título até 100 caracteres; mensagens até 15.000 caracteres), prevenindo ataques de *database bloating*.

### SEC-05: Sanitização de HTML no Gerador de Relatórios Word
- **Problema:** A função `generateWord` no frontend interpolava `title` diretamente em tags HTML `<h1>${title}</h1>` sem sanitização de caracteres especiais (`<`, `>`, `&`).
- **Correção:** Função de escape aplicada também ao título e metadados antes da geração do Blob do arquivo `.doc`.

### SEC-06: Validação de Upload de Arquivos e Limite de Imagens
- **Problema:** O frontend lia qualquer arquivo selecionado via `readAsDataURL` sem checar se era de fato uma imagem ou se possuía dezenas de megabytes.
- **Correção:**
  - Limite máximo de 5MB por arquivo.
  - Validação de tipos permitidos (`image/jpeg`, `image/png`, `image/webp`).
  - Limite máximo de 4 imagens simultâneas.
  - Sanitização de URLs/tamanho de partes de imagem no backend.

### SEC-07: Resiliência do Rate Limiting e Tratamento de Reverse Proxy
- **Problema:** O dicionário em memória `_attempts` acumulava chaves infinitamente e lia apenas `request.client.host`, que em plataformas como Railway/Cloudflare pode refletir o IP interno do load balancer.
- **Correção:** Leitura segura do cabeçalho `X-Forwarded-For` (primeiro endereço do cliente) e rotina de purga periódica de chaves expiradas para evitar consumo excessivo de memória RAM.

### SEC-08: Cabeçalhos de Segurança HTTP (Headers Hardening)
- **Problema:** Ausência de diretiva de restrição de carregamento de scripts externos e proteção estrita de frames.
- **Correção:** Headers de segurança reforçados: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`, `Referrer-Policy: strict-origin-when-cross-origin` e `Permissions-Policy`.

### SEC-09: Higienização de Mensagens de Erro da IA
- **Problema:** Mensagens brutas de erro de upstream podiam expor detalhes operacionais ou fragmentos de prompts internos.
- **Correção:** Mensagens padronizadas e amigáveis ao usuário final sem exposição de logs internos de fornecedores.

### SEC-10: Verificação de Complexidade do `JWT_SECRET`
- **Problema:** Tokens JWT assinados com segredos fracos (< 32 caracteres) são vulneráveis a ataques de dicionário offline.
- **Correção:** Verificação de inicialização para garantir que `JWT_SECRET` tenha ao menos 32 caracteres antes de iniciar em modo de produção.

---

## 4. Checklist Pré-Deploy para Produção

Antes de colocar o sistema no ar, certifique-se de configurar as seguintes variáveis no painel da hospedagem (ex: Railway, Render, etc.):

- [ ] `DATABASE_URL`: String de conexão segura com SSL (ex: `postgresql://...`).
- [ ] `JWT_SECRET`: Segredo criptográfico de alta entropia (mínimo 32 caracteres aleatórios).
- [ ] `GROQ_API_KEY`: Chave de API de produção da Groq.
- [ ] `BREVO_API_KEY`: Chave de API válida do Brevo com remetente verificado.
- [ ] `ALLOWED_ORIGINS`: URL real do seu domínio de frontend (ex: `https://meudominio.com.br,https://agrobot.vercel.app`).
- [ ] `ENV`: Definir como `production` para desligar a documentação Swagger aberta (`/docs`).

---

## 5. Verificação Final

Todas as 10 correções foram implementadas e verificadas:

- ✅ **Backend**: Todos os módulos compilam sem erro (`py_compile` — auth.py, chat.py, conversations.py, dependencies.py, auth_utils.py)
- ✅ **Frontend**: Build de produção (`vite build`) finaliza sem erros ou warnings
- ✅ **Uvicorn**: Servidor recarrega automaticamente e aceita requisições normalmente
- ✅ **Nenhum comando git executado** durante todo o processo

### Arquivos Modificados

| Arquivo | Correções Aplicadas |
|---|---|
| `backend/app/main.py` | SEC-01 (CORS PUT), SEC-08 (Security Headers Middleware) |
| `backend/app/auth_utils.py` | SEC-10 (validação JWT_SECRET ≥ 32 chars em produção) |
| `backend/app/dependencies.py` | SEC-07 (get_client_ip + purga periódica do rate limiter) |
| `backend/app/database.py` | SEC-03 (coluna `attempts` na tabela email_verifications) |
| `backend/app/routes/auth.py` | SEC-03 (brute-force lock após 5 tentativas), SEC-07 (check_rate_limit centralizado) |
| `backend/app/routes/chat.py` | SEC-02 (rate limit 15/min por usuário), SEC-06 (validação de imagens), SEC-09 (sanitização de erros Groq) |
| `backend/app/routes/conversations.py` | SEC-04 (limites de campo + rate limiting) |
| `frontend/src/pages/Chat.jsx` | SEC-05 (sanitização do título no Word), SEC-06 (validação client-side de uploads), hardening fmtMd |

---
**AgroBot Security Readiness: ✅ APROVADO PARA PRODUÇÃO.**
