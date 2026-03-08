---
name: arch-kb-skill
description: >
  Project Mnemonic — injects architectural context from a shared team Knowledge Base
  into every Claude Code session automatically. Use this skill at the START of every
  session, without exception. Triggers on ANY development task: refactoring, new
  features, debugging, code review, architectural decisions, creating files, writing
  tests, or any task involving source code. If the user opens Claude Code, this skill
  should activate. Do not wait to be asked — load context proactively before responding
  to the first task.
compatibility:
  tools: [bash, read_file, list_files]
  requires: node >= 18
---

# arch-kb-skill — Project Mnemonic

## Visão geral

Esta skill injeta contexto arquitetural do Knowledge Base centralizado da equipe
no início de cada sessão do Claude Code. O objetivo é eliminar a repetição de briefing
— o Claude já começa ciente dos princípios, padrões e decisões do time.

---

## Fluxo obrigatório — TODA sessão

### 1. Verificar instalação

```bash
node ~/.claude/skills/arch-kb-skill/scripts/check-install.js
```

Se retornar erro, seguir `references/install.md` antes de continuar.

### 2. Perguntar sobre atualização do KB

Antes de qualquer tarefa, perguntar ao usuário:

> "Deseja atualizar o Knowledge Base antes de começar? (recomendado se faz mais de 1 dia)"

- **Sim** → executar step 3
- **Não** → pular para step 4

### 3. Atualizar o KB (se solicitado)

```bash
node ~/.claude/skills/arch-kb-skill/scripts/update-kb.js
```

Mostrar resultado: quantas entradas, data do último commit.

### 4. Inferir contexto do projeto

Executar o script de inferência apontando para o diretório atual:

```bash
node ~/.claude/skills/arch-kb-skill/scripts/query.js --project-dir "$PWD"
```

O script inspeciona os arquivos do projeto e retorna as entradas relevantes do KB.
Ver `references/query-logic.md` para detalhes de como a inferência funciona.

### 5. Injetar contexto na sessão

Com o output do script, construir o bloco de contexto e **mantê-lo ativo durante toda
a sessão**. Formato:

```
## Contexto arquitetural ativo (Project Mnemonic)

Stack detectada: [stacks inferidas]
KB atualizado em: [data]

### Princípios ativos
[entradas tipo principle relevantes]

### Padrões ativos
[entradas tipo pattern relevantes]

### Decisões ativas
[entradas tipo decision relevantes]

### Implementações ativas
[entradas tipo implementation relevantes para a stack]
```

### 6. Confirmar ao usuário

Informar brevemente:

> "Contexto carregado: N entradas do KB (stack: X). Pode começar."

---

## Durante a sessão

### Aplicar contexto ativamente

Não carregar o KB passivamente — **usar ativamente**:

- Ao criar novo artefato → verificar se há template em `code-templates-by-artifact`
- Ao propor abstração → aplicar `pragmatic-abstraction` (ganho real e imediato?)
- Ao refatorar → aplicar `incremental-refactoring-never-big-bang` (um grupo por commit)
- Ao nomear → aplicar `explicit-domain-rules-naming` e convenções da stack
- Ao criar teste → aplicar `testing-strategy-adapted-pyramid` + implementação da stack
- Ao criar hook/componente → aplicar entradas React ativas

### Alertar violações

Se detectar violação de princípio ou padrão do KB durante a tarefa, alertar:

> "⚠️ Mnemonic: isso viola [nome da entrada]. [Resumo do princípio]. Sugestão: [alternativa]"

### Não bloquear

Alertas são informativos, não bloqueantes. O usuário decide como proceder.

---

## Ao final da sessão

### 7. Registrar outcome (opcional mas recomendado)

Se algo relevante aconteceu (princípio validado, padrão falhou, nova decisão tomada):

```bash
node ~/.claude/skills/arch-kb-skill/scripts/record-outcome.js \
  --entry-id <id-da-entrada> \
  --outcome <validated|partial|failed> \
  --note "Descrição do que aconteceu"
```

Perguntar ao usuário se deseja registrar antes de encerrar.

---

## Referências

- `references/install.md` — instalação e configuração inicial
- `references/query-logic.md` — como a inferência de stack e filtragem funcionam
- `references/config.md` — opções de configuração disponíveis
