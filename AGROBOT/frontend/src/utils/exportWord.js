import { downloadBlob, slugify } from './download';
import { escapeHtml } from './markdown';

// ── Geração de Word (.doc) ──
// Word abre HTML com os namespaces do Office como documento nativo.
export function generateWord(title, text) {
  const date = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const clean = escapeHtml(text)
    .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
    .replace(/\*(.*?)\*/g, '<i>$1</i>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');

  // SEC-05: Sanitiza o título da mesma forma que o body
  const safeTitle = escapeHtml(title);

  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><style>@page{size:A4;margin:2cm 2.5cm}body{font-family:Calibri,sans-serif;font-size:11pt;color:#121a15}h1{font-family:Georgia,serif;color:#15241c;border-bottom:2px solid #2e8b57;padding-bottom:6pt}h2,h3{color:#1f5e39}li{margin-bottom:4pt}b{color:#15241c}</style></head><body><table width="100%" style="background:#15241c;padding:14pt 20pt;margin-bottom:20pt"><tr><td><span style="font-family:Arial;font-size:14pt;font-weight:bold;color:#ffffff">AGROBOT</span><br><span style="font-family:Arial;font-size:8pt;color:#d5e5db">Laudo Técnico e Prescrição Agronômica</span></td><td align="right"><span style="font-size:9pt;color:#ffffff">${date}</span></td></tr></table><h1>${safeTitle}</h1><div><p>${clean}</p></div><p style="font-size:8pt;color:#6c7d70;text-align:center;margin-top:30pt">AgroBot · Documento Técnico Normatizado</p></body></html>`;

  const blob = new Blob([html], { type: 'application/msword;charset=utf-8' });
  downloadBlob(blob, `agrobot_laudo_${slugify(title) || 'documento'}.doc`);
}

/** Relatório da conversa inteira em texto puro (.txt ou .md). */
export function exportConversation(messages, userName, ext) {
  let out = `AGROBOT - RELATÓRIO DE CONSULTA TÉCNICA\nEmitido em: ${new Date().toLocaleString('pt-BR')}\n\n`;
  messages.forEach((m) => {
    const who = m.role === 'user' ? userName : 'AgroBot';
    out += `[${who}]:\n${m.text}\n\n---\n\n`;
  });
  const blob = new Blob([out], { type: 'text/plain;charset=utf-8' });
  downloadBlob(blob, `agrobot_consulta_${Date.now()}.${ext}`);
}
