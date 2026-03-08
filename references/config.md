# Configuração — Project Mnemonic

Arquivo: `~/.claude/skills/arch-kb-skill/config.json`

## Opções disponíveis

| Campo               | Tipo    | Padrão                              | Descrição                                    |
|---------------------|---------|-------------------------------------|----------------------------------------------|
| `kbPath`            | string  | `~/.claude/knowledge-bases/arch-kb` | Path local do KB clonado                     |
| `kbRepo`            | string  | URL do repo SAT                     | URL do repositório Git do KB                 |
| `autoUpdate`        | boolean | `false`                             | Se `true`, faz pull automático sem perguntar |
| `maxEntriesPerType` | number  | `10`                                | Limite de entradas por tipo no contexto      |
| `language`          | string  | `pt-BR`                             | Idioma dos prompts e mensagens               |

## Exemplo completo

```json
{
  "kbPath": "~/.claude/knowledge-bases/arch-kb",
  "kbRepo": "https://github.com/satsolucoes/sat-architecture-kb.git",
  "autoUpdate": false,
  "maxEntriesPerType": 10,
  "language": "pt-BR"
}
```

## Configuração para Windows

No Windows, use barras normais ou variável de ambiente:

```json
{
  "kbPath": "C:/Users/SeuNome/.claude/knowledge-bases/arch-kb"
}
```

O Node.js resolve paths corretamente em qualquer OS.

## autoUpdate

Com `autoUpdate: false` (padrão), o Claude Code pergunta no início de cada sessão:
> "Deseja atualizar o Knowledge Base antes de começar?"

Com `autoUpdate: true`, o pull é feito silenciosamente sem perguntar.
Recomendado apenas se você quer zero fricção e confia que o KB está sempre estável.

## maxEntriesPerType

Limita quantas entradas de cada tipo são incluídas no contexto.
Útil se o KB crescer muito e o contexto ficar longo demais.

Valor `0` = sem limite.
