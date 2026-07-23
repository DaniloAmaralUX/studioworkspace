// Carrega backend/.env (se existir) usando o suporte nativo do Node — zero dependências.
// Importado ANTES de qualquer módulo que leia process.env, para que a chave do
// AI Gateway (AI_GATEWAY_API_KEY) fique disponível sem configurar a shell na mão.
try {
  ;(process as { loadEnvFile?: (path?: string) => void }).loadEnvFile?.()
} catch {
  /* sem .env — segue com o ambiente do processo como está */
}
