# Query Logic — como o Mnemonic infere contexto

## Visão geral

O `query.js` inspeciona o diretório do projeto atual e infere quais stacks estão
em uso, sem depender de configuração manual por sessão.

## Inferência de stack

O script procura por arquivos de assinatura no diretório raiz do projeto:

| Stack          | Arquivo de assinatura                | Condição adicional      |
|----------------|--------------------------------------|-------------------------|
| `react`        | `package.json`                       | contém `"react"`        |
| `react-native` | `package.json`                       | contém `"react-native"` |
| `typescript`   | `tsconfig.json`                      | qualquer                |
| `vite`         | `vite.config.ts` ou `vite.config.js` | qualquer                |
| `kotlin`       | `build.gradle.kts`                   | qualquer                |
| `java`         | `pom.xml` ou `build.gradle`          | não contém `kotlin`     |
| `angular`      | `angular.json`                       | qualquer                |
| `node`         | `package.json`                       | não é react nem angular |
| `universal`    | —                                    | sempre incluído         |

## Filtragem de entradas

Com as stacks inferidas, o script filtra `index.json` retornando entradas onde
**pelo menos uma** das stacks da entrada está no conjunto inferido.

Exemplo: projeto React/TypeScript infere `['universal', 'react', 'typescript', 'vite']`

→ Inclui entradas com `stacks: ['universal']` ✅
→ Inclui entradas com `stacks: ['react', 'react-native']` ✅
→ Inclui entradas com `stacks: ['react', 'typescript']` ✅
→ Exclui entradas com `stacks: ['kotlin']` ❌
→ Exclui entradas com `stacks: ['java']` ❌

## Agrupamento e ordem

As entradas são agrupadas por tipo e exibidas na ordem:

1. `principle` — fundamentos, sempre primeiro
2. `pattern` — padrões de solução
3. `decision` — ADRs e decisões arquiteturais
4. `refactoring` — lições de refactoring
5. `implementation` — detalhes de implementação por stack

## Formato de saída

### Padrão (contexto completo)

Inclui o conteúdo das primeiras 40 linhas de cada entrada (sem frontmatter YAML).
Usado para injeção no contexto da sessão.

### `--summary`

Uma linha com total de entradas e stacks detectadas.
Usado para confirmação rápida ao usuário.

### `--json`

Saída JSON completa com stacks inferidas, entradas filtradas e agrupamento.
Usado para debug ou integrações.

## Limitações conhecidas

- A inferência é baseada em arquivos na raiz — monorepos com múltiplas stacks
  podem precisar de `--project-dir` apontando para o subprojeto correto.
- Arquivos em subdiretórios não são inspecionados (só a raiz do projeto).
- Projetos sem nenhum arquivo de assinatura retornam apenas entradas `universal`.
