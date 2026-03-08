# arch-kb-skill — Project Mnemonic

> Skill do Claude Code que injeta contexto arquitetural da equipe automaticamente em toda sessão.

## O problema que resolve

Cada sessão do Claude Code começa do zero. Você repete os mesmos princípios, padrões e decisões arquiteturais a cada
vez. O Mnemonic elimina isso — o Claude já começa ciente do que o time construiu.

## Como funciona

```
KB centralizado (GitHub)
  ↓ clonado localmente
~/.claude/knowledge-bases/arch-kb/
  ↓ inspecionado no início de cada sessão
arch-kb-skill (esta skill)
  ↓ infere stack do projeto atual
  ↓ filtra entradas relevantes do KB
  ↓ injeta contexto no Claude Code
Claude Code começa com contexto arquitetural ativo
```

## Instalação rápida

```bash
# 1. Clonar a skill
git clone https://github.com/satsolucoes/sat-architecture-kb-skill.git \
  ~/.claude/skills/arch-kb-skill

# 2. Configurar
cp ~/.claude/skills/arch-kb-skill/config.example.json \
   ~/.claude/skills/arch-kb-skill/config.json

# 3. Baixar o KB
node ~/.claude/skills/arch-kb-skill/scripts/update-kb.js

# 4. Verificar
node ~/.claude/skills/arch-kb-skill/scripts/check-install.js
```

Ver `references/install.md` para instruções detalhadas e troubleshooting.

## O que o Mnemonic faz em cada sessão

1. **Verifica** se a instalação está ok
2. **Pergunta** se deseja atualizar o KB (git pull)
3. **Inspeciona** os arquivos do projeto para inferir a stack
4. **Filtra** entradas relevantes do KB por stack
5. **Injeta** contexto formatado no início da sessão
6. **Aplica** ativamente durante a sessão — alerta violações, sugere padrões
7. **Registra** outcomes de volta no KB ao final (opcional)

## Scripts disponíveis

```bash
# Verificar instalação
node ~/.claude/skills/arch-kb-skill/scripts/check-install.js

# Atualizar KB
node ~/.claude/skills/arch-kb-skill/scripts/update-kb.js

# Consultar KB manualmente
node ~/.claude/skills/arch-kb-skill/scripts/query.js --project-dir /caminho/do/projeto
node ~/.claude/skills/arch-kb-skill/scripts/query.js --summary
node ~/.claude/skills/arch-kb-skill/scripts/query.js --json

# Registrar outcome
node ~/.claude/skills/arch-kb-skill/scripts/record-outcome.js \
  --entry-id pragmatic-abstraction \
  --outcome validated \
  --note "Removemos abstração sem ganho real no módulo X"
```

## Repositórios relacionados

| Repo                                                                                  | Descrição                                                |
|---------------------------------------------------------------------------------------|----------------------------------------------------------|
| [sat-architecture-kb](https://github.com/satsolucoes/sat-architecture-kb)             | KB centralizado — princípios, padrões e decisões do time |
| [sat-architecture-kb-skill](https://github.com/satsolucoes/sat-architecture-kb-skill) | Esta skill                                               |

## Estrutura do repositório

```
arch-kb-skill/
├── SKILL.md                    ← instruções para o Claude Code
├── config.example.json         ← template de configuração
├── scripts/
│   ├── query.js                ← inferência de stack e filtragem do KB
│   ├── update-kb.js            ← git clone/pull do KB
│   ├── record-outcome.js       ← feedback loop para o KB
│   └── check-install.js        ← verificação de instalação
├── references/
│   ├── install.md              ← guia de instalação detalhado
│   ├── query-logic.md          ← como a inferência funciona
│   └── config.md               ← opções de configuração
└── README.md
```

---

*Project Mnemonic — porque conhecimento construído não deve ser repetido.*
