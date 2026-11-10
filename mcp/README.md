# ZernFlow MCP (borradores)

Servidor MCP local (stdio) para que un asistente cree y edite flujos de ZernFlow **como borrador**. No publica nada.

## Qué puede y qué no puede hacer

| Herramienta | Qué hace |
|---|---|
| `list_channels` | Canales del workspace (id, plataforma, nombre). |
| `list_flows` | id, nombre, status, version, updated_at. |
| `get_flow` | nodes/edges completos de un flujo. |
| `create_flow_draft` | Crea un flujo con `status = 'draft'` y `version = 1`. |
| `update_flow_draft` | Actualiza nombre/nodes/edges **solo si el flujo es `draft`**. Rechaza `published` y `archived`. |
| `build_comment_to_dm_flow` | Genera nodes/edges del patrón comentario → respuesta pública → DM (→ etiqueta). No guarda; pasa el resultado a `create_flow_draft`. |

No existen herramientas para publicar, borrar flujos ni escribir en `triggers`. Los triggers se sincronizan solo al publicar desde la app (`app/api/v1/flows/[flowId]/publish`), así que un borrador creado aquí no activa nada.

Todas las consultas se filtran por `workspace_id = ZERNFLOW_WORKSPACE_ID`.

## Instalar y compilar

```bash
npm install
npm run build:mcp
```

Genera `mcp/dist/server.js` (está en `.gitignore`).

## Variables de entorno

| Variable | Descripción |
|---|---|
| `SUPABASE_URL` | URL del proyecto en la nube, p. ej. `https://binxdtdayszfqkgogzmi.supabase.co`. Debe ser `https://` (no uses el `.env.local` local). |
| `ZERNFLOW_WORKSPACE_ID` | UUID del único workspace sobre el que se opera. |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave service role. Alternativa: archivo de clave (abajo). |
| `SERVICE_KEY_FILE` | Ruta de un archivo con la clave. Por defecto `~/.config/estudioflow/supabase-service.key`. |

La clave nunca se imprime, no se registra en logs y se redacta de cualquier mensaje de error. Si guardas la clave en un archivo, dale permisos restringidos: `chmod 600 ~/.config/estudioflow/supabase-service.key`.

## Registrarlo en Claude Code

```bash
claude mcp add zernflow -- node <ruta>/mcp/dist/server.js
```

Con las variables de entorno (la clave se lee del archivo por defecto):

```bash
claude mcp add zernflow \
  -e SUPABASE_URL=https://binxdtdayszfqkgogzmi.supabase.co \
  -e ZERNFLOW_WORKSPACE_ID=<uuid-del-workspace> \
  -- node <ruta>/mcp/dist/server.js
```

## Formato de nodos

Se valida con zod y coincide con lo que guarda el constructor visual. Tipos de nodo permitidos: `trigger`, `sendMessage`, `condition`, `delay`, `action`, `aiResponse`. Cualquier otro tipo se rechaza.

- `trigger`: `data.triggerType` (`keyword`, `postback`, `quick_reply`, `welcome`, `default`, `comment_keyword`), `data.keywords = [{ value, matchType }]`. Para comentarios: `data.replyText`, `data.postIds`, `data.alsoMatchInDms`.
- `sendMessage`: `data.messages = [{ text, imageUrl, quickReplies, buttons }]`.
- `condition`: `data.conditions`, `data.logic`; las salidas usan `sourceHandle` `yes` / `no`.
- `delay`: `data.duration`, `data.unit`.
- `action`: `data.actionType` (`addTag`, `removeTag`, `setCustomField`, `httpRequest`, `goToFlow`, `subscribe`, `unsubscribe`, `humanTakeover`, `abSplit`, `smartDelay`, `enrollSequence`) más sus campos (p. ej. `tagName`).
- `aiResponse`: `data.systemPrompt`, `data.model`.

Los ids de nodo deben ser únicos y cada conexión debe apuntar a nodos existentes.

## Pruebas

```bash
npx vitest run mcp
```
