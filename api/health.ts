// Primeira função da variante Studio Cloud (PLANO2.md, Fatia 0).
// Fora do tsconfig do SPA de propósito: a Vercel compila funções de api/ separadamente.
export default function handler(_req: any, res: any) {
  res.status(200).json({ ok: true, variant: 'cloud' })
}
