# Buteco do Alemão

Sistema de pedidos em tempo real: o cliente abre o cardápio digital no celular, faz o pedido e acompanha o status ao vivo enquanto a cozinha prepara no painel.

## Funcionalidades

- **Cardápio digital** (mobile-first, dark mode preto fosco com vermelho `#E50914` e dourado `#FFC107`)
- **Carrinho e checkout** com número do pedido
- **Acompanhamento ao vivo** do status (Novo -> Preparando -> Pronto)
- **Painel da cozinha** (Kanban): Novos / Preparando / Prontos
- **Comandas por mesa**: agrupa pedidos, fecha comanda e confirma pagamento
- **Cardápio editável**: adicionar, editar e excluir itens e categorias direto pelo painel
- **Gestão de dispositivos**: ver quem está conectado (clientes e painéis) e expulsar acessos
- **Painel protegido por PIN**: só quem tem o PIN do balcão opera o painel da cozinha
- **PWA instalável**: ícone na tela inicial do celular
- **Tempo real** via WebSocket (sem recarregar a página)

## URLs

| O quê | Rota |
|---|---|
| Landing / cardápio do cliente | `/` |
| Cardápio digital do cliente | `/#/cardapio` |
| Painel da cozinha | `/#/cozinha` |

## Rodando localmente

Requisitos: Node.js 18+.

```bash
npm install
npm run dev
```

Frontend em `http://localhost:5173`, servidor WebSocket/API em `http://localhost:4000` (com proxy do Vite para `/ws`).

### PIN do painel da cozinha

O painel (`/#/cozinha`) exige um PIN. O padrão é `1234` e pode ser
alterado por variável de ambiente:

```bash
KITCHEN_PIN=9876 npm start
```

O PIN fica salvo no navegador (por sessão) para não pedir a cada acesso.

### Produção

```bash
npm run build
npm start
```

Serve o `dist` e o WebSocket na porta `4000`.

## Docker

```bash
docker build -t buteco-do-alemao .
docker run -d -p 4000:4000 -v buteco-data:/app/data buteco-do-alemao
```

O cardápio é persistido em `/app/data/menu.json` (criado automaticamente com o cardápio padrão). Use um volume para não perder as edições.

## Deploy gratuito

O servidor usa WebSocket, então precisa de um processo de longa duração (não dá para hospedar em hospedagem estática).

> **Firebase Hosting não serve para este app.** Ele só publica arquivos
> estáticos — não roda o servidor Node nem mantém conexões WebSocket.
> Para usar Firebase você teria de rodar o backend Node em outro lugar
> (Render/Railway/Fly) e apontar o frontend para ele.

### Opção 1 — Render

1. Crie um **Web Service** apontando para o repositório deste projeto.
2. Build command: `npm ci && npm run build`
3. Start command: `npm start`
4. Plan: **Free**. No Render free, o serviço "dorme" após 15 min sem acesso e o disco é efêmero.

**Atenção (Render free):** o disco é apagado a cada redeploy. As edições do cardápio
(`/app/data/menu.json`) serão perdidas ao fazer deploy novo. Para manter o cardápio:
- monte um **Disk** (plano pago), ou
- **edite o arquivo commitado `seed/menu.json`** e faça commit: em disco novo,
  o servidor usa `seed/menu.json` como ponto de partida.

### Opção 2 — Railway (recomendada)

O repositório já tem `Dockerfile` e `railway.toml` (build via Dockerfile e
healthcheck em `/`). Passo a passo:

1. **Subir o código para o GitHub** (o Railway precisa do repositório ou do `railway up` com a CLI).

2. **Criar o projeto no Railway:**
   - Dashboard -> **New Project** -> **Deploy from GitHub** -> escolha o repositório.
   - O Railway detecta o `Dockerfile` automaticamente e faz o deploy.

3. **Porta:** o servidor escuta em `process.env.PORT` (o Railway injeta essa
   variável sozinho; se não vier, usa `4000`). Não precisa configurar nada.

4. **Definir o PIN do painel (importante):** aba **Variables** do serviço,
   adicione `KITCHEN_PIN` com o PIN que você quiser. Se não definir, vale `1234`.

5. **Gerar o domínio público:** aba **Settings** -> **Networking** ->
   **Generate Domain**. Você recebe um endereço `https://xxx.up.railway.app`
   — use-o como URL do cardápio e do painel (o WebSocket usa o mesmo domínio).

6. **Persistir o cardápio (recomendado):** no free/trial o disco é efêmero e
   o `data/menu.json` é recriado a cada novo deploy. Para guardar as edições:
   - **Volumes (plano pago):** aba **Volumes** -> **New Volume** com mount path
     `/app/data`. As edições do cardápio sobrevivem a redeploys.
   - **Sem volume:** edite o arquivo commitado `seed/menu.json` e faça commit.
     Em disco novo, o servidor usa `seed/menu.json` como ponto de partida
     (ele é incluído na imagem Docker automaticamente).

**WebSocket:** funciona normalmente no domínio `https://*.up.railway.app`
(o frontend já usa `wss://` automaticamente em HTTPS).

### Opção 3 — Fly.io

```bash
flyctl launch --dockerfile Dockerfile
flyctl volumes create buteco_data --size 1
flyctl deploy
```

Monte o volume em `/app/data` via `fly.toml`.

## Protocolo WebSocket

`ws://<host>/ws`

| Mensagem | Direção | Descrição |
|---|---|---|
| `{type:'identify', payload:{role:'kitchen'\|'client', label, pin}}` | cliente -> servidor | identifica o dispositivo (cozinha exige `pin`) |
| `{type:'auth_error'}` | servidor -> cliente | PIN de cozinha incorreto |
| `{type:'sync'}` | servidor -> cliente | estado inicial (menu, pedidos, comandas, dispositivos) |
| `{type:'menu'}` | servidor -> cliente | cardápio atualizado (após qualquer edição) |
| `{type:'devices'}` | servidor -> cliente | lista de dispositivos (só para cozinha) |
| `{type:'kick', payload:{deviceId}}` | cozinha -> servidor | expulsa um dispositivo (envia `kicked` e fecha) |
| `{type:'place_order'}` | cliente -> servidor | novo pedido |
| `{type:'update_status'}` | cozinha -> servidor | avança status do pedido |
| `{type:'close_comanda'}` / `{type:'confirm_payment'}` | cozinha -> servidor | gerencia comandas |

## Testes

```bash
node scripts/browser-test.mjs   # renderização das 3 telas sem erro de runtime
node scripts/e2e-test.mjs       # fluxo completo de pedido em tempo real
node scripts/e2e-comanda.mjs    # fluxo de comanda por mesa
node scripts/e2e-admin.mjs      # cardápio editável + expulsão de dispositivo
node scripts/e2e-pin.mjs        # autenticação por PIN do painel
```

## Nota de segurança

O painel é protegido por PIN (`KITCHEN_PIN`, padrão `1234`). Altere a senha
antes de publicar. Comandos do painel (editar cardápio, expulsar dispositivos,
mudar status) só são aceitos de conexões identificadas como cozinha com PIN
válido.
