import { z } from 'zod'

/** Params padrão das rotas /api/.../:id — valida e tipa o req.params. */
export const idParams = z.object({ id: z.string().min(1) })
