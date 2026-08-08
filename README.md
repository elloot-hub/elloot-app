# Elloot App

Frontend do marketplace [Elloot](https://github.com/faite-push/elloot-app) — Next.js 16, Tailwind v4, shadcn.

API irmã: [`elloot-api`](https://github.com/faite-push/elloot-api).

## Requisitos

- Node.js 20+
- API local em `http://localhost:5000` (ou a URL do seu `.env.local`)

## Setup

```bash
git clone https://github.com/faite-push/elloot-app.git
cd elloot-app
npm install
cp .env.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:5000
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Scripts

| Comando | Uso |
|---------|-----|
| `npm run dev` | Dev server |
| `npm run build` | Build de produção |
| `npm run start` | Serve o build |
| `npm run lint` | ESLint |

## Estrutura

```
src/
  app/              # Rotas (páginas finas)
    (marketing)/    # Home /
    (main)/         # market, sell, listings, orders…
    (auth)/         # login, register, callback
  components/       # UI + layout
  features/         # Domínio de UI + client API
  lib/              # api client, routes, config
  types/api.ts      # Tipos alinhados à API
```

Cada pasta em `src/features/*/index.ts` tem **STATUS** e “onde mexer”.

## Rotas canônicas

Definidas em [`src/lib/routes.ts`](./src/lib/routes.ts):

- Mercado: `/market` (`?category=slug`)
- Anunciar: `/sell` (wizard Produto → Ofertas → Imagens → Revisar)
- Anúncio: `/listings/[id]`
- Pedidos: `/orders`, `/orders/[id]`

## Convenções

1. Página em `app/` só monta layout + feature — lógica fica em `features/`.
2. Paths públicos em inglês; textos da UI em português.
3. Não commitar `.env.local` — use `.env.example`.

## Licença

Privado / uso do time Elloot.
