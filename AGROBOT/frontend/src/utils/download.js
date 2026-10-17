/** Baixa um Blob com o nome informado e libera a URL temporária em seguida. */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Dá tempo ao navegador de iniciar o download antes de revogar
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Transforma um título em um trecho seguro para nome de arquivo. */
export function slugify(title) {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 36);
}
