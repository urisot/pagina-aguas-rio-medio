import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const noticias = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/noticias' }),
  schema: z.object({
    titulo: z.string(),
    resumen: z.string(),
    fecha: z.coerce.date(),
    categoria: z.string(),
    destacada: z.boolean().default(false),
  }),
});

const sabiasQue = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/sabias-que' }),
  schema: z.object({
    titulo: z.string(),
    resumen: z.string(),
    fecha: z.coerce.date(),
    lectura: z.string(),
  }),
});

export const collections = { noticias, 'sabias-que': sabiasQue };
