# Instalação — Project Mnemonic (arch-kb-skill)

## Pré-requisitos

- Node.js >= 18
- Git
- Claude Code instalado

## Passo a passo

### 1. Clonar a skill

```bash
git clone https://github.com/satsolucoes/sat-architecture-kb-skill.git \
  ~/.claude/skills/arch-kb-skill
```

### 2. Configurar

```bash
cp ~/.claude/skills/arch-kb-skill/config.example.json \
   ~/.claude/skills/arch-kb-skill/config.json
```

Editar `config.json` se necessário (o padrão já funciona para a maioria dos devs):

```json
{
  "kbPath": "~/.claude/knowledge-bases/arch-kb",
  "kbRepo": "https://github.com/satsolucoes/sat-architecture-kb.git",
  "autoUpdate": false,
  "language": "pt-BR"
}
```

### 3. Baixar o KB

```bash
node ~/.claude/skills/arch-kb-skill/scripts/update-kb.js
```

### 4. Verificar instalação

```bash
node ~/.claude/skills/arch-kb-skill/scripts/check-install.js
```

Saída esperada:

```
✅ Node.js >= 18
✅ Skill instalada
✅ SKILL.md presente
✅ Scripts presentes
✅ config.json presente
✅ KB encontrado
✅ index.json no KB
✅ Git disponível

✅ Tudo certo! Project Mnemonic pronto para uso.
```

## Atualizar a skill

```bash
cd ~/.claude/skills/arch-kb-skill && git pull
```

## Atualizar o KB manualmente

```bash
node ~/.claude/skills/arch-kb-skill/scripts/update-kb.js
```

## Desinstalar

```bash
rm -rf ~/.claude/skills/arch-kb-skill
rm -rf ~/.claude/knowledge-bases/arch-kb
```

## Troubleshooting

**"KB não encontrado"**
→ Rode `update-kb.js` para clonar o KB.

**"index.json não encontrado"**
→ O repo do KB pode estar incompleto. Verifique o GitHub.

**"git pull falhou"**
→ Pode haver conflito local. Rode `git -C ~/.claude/knowledge-bases/arch-kb status` para investigar.

**"Node.js < 18"**
→ Atualize o Node em https://nodejs.org ou via `nvm use 18`.
