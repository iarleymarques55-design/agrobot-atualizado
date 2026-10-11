"""
email_service.py — Envio de emails via API do Brevo (ex-Sendinblue).
Usa sib-api-v3-sdk com requisições síncronas em thread pool para não bloquear o event loop.
"""
import os
import secrets
import asyncio
from functools import partial

import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException

BREVO_API_KEY = os.getenv("BREVO_API_KEY", "")
BREVO_SENDER_EMAIL = os.getenv("BREVO_SENDER_EMAIL", "noreply@agrobot.com.br")
BREVO_SENDER_NAME = os.getenv("BREVO_SENDER_NAME", "AgroBot")


def _get_api_instance():
    configuration = sib_api_v3_sdk.Configuration()
    configuration.api_key["api-key"] = BREVO_API_KEY
    return sib_api_v3_sdk.TransactionalEmailsApi(
        sib_api_v3_sdk.ApiClient(configuration)
    )


def generate_verification_code() -> str:
    """Gera código numérico de 6 dígitos usando CSPRNG."""
    return str(secrets.randbelow(900000) + 100000)


def _send_verification_email_sync(to_email: str, to_name: str, code: str) -> bool:
    """
    Envia o email de verificação de forma síncrona.
    Chamado em thread pool para não bloquear o event loop.
    """
    if not BREVO_API_KEY:
        print("[EMAIL] BREVO_API_KEY não configurada. Email não enviado.")
        return False

    api_instance = _get_api_instance()

    html_content = f"""
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verificação de E-mail — AgroBot</title>
</head>
<body style="margin:0;padding:0;background-color:#080D09;font-family:'Inter','Helvetica Neue',Arial,sans-serif;color:#FFFFFF;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#080D09;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0"
               style="background-color:#0D140F;border:1px solid rgba(163,230,53,0.18);border-radius:12px;overflow:hidden;max-width:560px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 24px;border-bottom:1px solid rgba(255,255,255,0.06);">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;padding-right:10px;">
                    <div style="width:28px;height:28px;background:rgba(163,230,53,0.12);border:1px solid #A3E635;border-radius:6px;display:inline-flex;align-items:center;justify-content:center;">
                      🌱
                    </div>
                  </td>
                  <td style="vertical-align:middle;">
                    <span style="font-family:'Inter',Arial,sans-serif;font-size:18px;font-weight:700;color:#FFFFFF;letter-spacing:-0.01em;">
                      AgroBot
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px 0;">
              <p style="font-size:11px;font-weight:700;letter-spacing:0.14em;color:#A3E635;text-transform:uppercase;margin:0 0 14px;">
                — VERIFICAÇÃO DE E-MAIL
              </p>
              <h1 style="font-size:26px;font-weight:800;color:#FFFFFF;margin:0 0 16px;letter-spacing:-0.02em;line-height:1.2;">
                Confirme seu e-mail
              </h1>
              <p style="font-size:14.5px;line-height:1.7;color:#B2BFB5;margin:0 0 28px;">
                Olá, <strong style="color:#FFFFFF;">{to_name}</strong>! Use o código abaixo para verificar seu endereço de e-mail no AgroBot.
                O código expira em <strong style="color:#FFFFFF;">15 minutos</strong>.
              </p>

              <!-- Código -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <div style="background:#131D15;border:1px solid rgba(163,230,53,0.3);border-radius:10px;padding:20px 0;display:inline-block;width:100%;">
                      <span style="font-family:'Courier New',monospace;font-size:38px;font-weight:700;letter-spacing:0.18em;color:#A3E635;">
                        {code}
                      </span>
                    </div>
                  </td>
                </tr>
              </table>

              <p style="font-size:13px;line-height:1.6;color:#8C998F;margin:0 0 32px;">
                Se você não criou uma conta no AgroBot, ignore este e-mail. Nenhuma ação é necessária.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px 28px;border-top:1px solid rgba(255,255,255,0.06);">
              <p style="font-size:11.5px;color:#5C6A60;margin:0;text-align:center;">
                © 2026 AgroBot · Sistema ATMS · Agronomia de Precisão
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""

    send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
        to=[{"email": to_email, "name": to_name}],
        sender={"email": BREVO_SENDER_EMAIL, "name": BREVO_SENDER_NAME},
        subject="Seu código de verificação AgroBot",
        html_content=html_content,
    )

    try:
        api_instance.send_transac_email(send_smtp_email)
        print(f"[EMAIL] Código de verificação enviado para {to_email}")
        return True
    except ApiException as e:
        print(f"[EMAIL ERRO] Falha ao enviar email via Brevo: {e}")
        print(f"\n{'='*50}\n[CÓDIGO DE VERIFICAÇÃO]: {code} (para {to_email})\n{'='*50}\n")
        return False


async def send_verification_email(to_email: str, to_name: str, code: str) -> bool:
    """
    Wrapper assíncrono: executa o envio em thread pool
    para não bloquear o event loop do FastAPI.
    """
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(
        None,
        partial(_send_verification_email_sync, to_email, to_name, code),
    )
    return result
