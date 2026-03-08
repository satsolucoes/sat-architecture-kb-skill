#!/usr/bin/env node

/**
 * Project Mnemonic — query.js
 * Inspeciona o projeto atual, infere stacks e retorna entradas relevantes do KB.
 */

import {existsSync, readFileSync} from 'fs';
import {join, resolve} from 'path';
import {homedir} from 'os';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const CONFIG_PATH = join(homedir(), '.claude', 'skills', 'arch-kb-skill', 'config.json');
const DEFAULT_KB_PATH = join(homedir(), '.claude', 'knowledge-bases', 'arch-kb');

function loadConfig() {
    if (!existsSync(CONFIG_PATH)) return {};
    try {
        return JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
    } catch {
        return {};
    }
}

// ---------------------------------------------------------------------------
// Stack inference
// ---------------------------------------------------------------------------

const STACK_SIGNATURES = [
    // React
    {
        stack: 'react',
        files: ['package.json'],
        check: (content) => content.includes('"react"'),
    },
    // TypeScript
    {
        stack: 'typescript',
        files: ['tsconfig.json', 'tsconfig.base.json'],
        check: () => true,
    },
    // Vite
    {
        stack: 'vite',
        files: ['vite.config.ts', 'vite.config.js'],
        check: () => true,
    },
    // Kotlin
    {
        stack: 'kotlin',
        files: ['build.gradle.kts', 'settings.gradle.kts'],
        check: () => true,
    },
    // Java / Spring
    {
        stack: 'java',
        files: ['pom.xml', 'build.gradle'],
        check: (content) => !content.includes('kotlin'),
    },
    // Angular
    {
        stack: 'angular',
        files: ['angular.json'],
        check: () => true,
    },
    // Node
    {
        stack: 'node',
        files: ['package.json'],
        check: (content) => !content.includes('"react"') && !content.includes('"angular"'),
    },
];

function inferStacks(projectDir) {
    const stacks = new Set(['universal']); // sempre incluir universal

    for (const sig of STACK_SIGNATURES) {
        for (const filename of sig.files) {
            const filepath = join(projectDir, filename);
            if (existsSync(filepath)) {
                try {
                    const content = readFileSync(filepath, 'utf-8');
                    if (sig.check(content)) {
                        stacks.add(sig.stack);
                    }
                } catch {
                    // arquivo existe mas não é legível — ignorar
                }
            }
        }
    }

    // react-native: package.json com react-native
    const pkgPath = join(projectDir, 'package.json');
    if (existsSync(pkgPath)) {
        try {
            const pkg = readFileSync(pkgPath, 'utf-8');
            if (pkg.includes('"react-native"')) stacks.add('react-native');
        } catch { /* ignorar */
        }
    }

    return [...stacks];
}

// ---------------------------------------------------------------------------
// KB loading
// ---------------------------------------------------------------------------

function loadIndex(kbPath) {
    const indexPath = join(kbPath, 'index.json');
    if (!existsSync(indexPath)) {
        throw new Error(`index.json não encontrado em: ${indexPath}`);
    }
    return JSON.parse(readFileSync(indexPath, 'utf-8'));
}

function loadEntryContent(kbPath, entry) {
    const filepath = join(kbPath, entry.file);
    if (!existsSync(filepath)) return null;
    try {
        return readFileSync(filepath, 'utf-8');
    } catch {
        return null;
    }
}

// ---------------------------------------------------------------------------
// Filtering
// ---------------------------------------------------------------------------

function filterEntries(entries, inferredStacks) {
    return entries.filter((entry) => {
        const entryStacks = entry.stacks || [];
        // incluir se alguma stack da entrada bate com as inferidas
        return entryStacks.some((s) => inferredStacks.includes(s));
    });
}

function groupByType(entries) {
    return entries.reduce((acc, entry) => {
        const type = entry.type || 'other';
        if (!acc[type]) acc[type] = [];
        acc[type].push(entry);
        return acc;
    }, {});
}

// ---------------------------------------------------------------------------
// Output formatting
// ---------------------------------------------------------------------------

function formatContext(grouped, kbPath, inferredStacks) {
    const lines = [];
    const date = new Date().toLocaleDateString('pt-BR');

    lines.push(`## Contexto arquitetural ativo (Project Mnemonic)`);
    lines.push(`Stack detectada: ${inferredStacks.filter(s => s !== 'universal').join(', ') || 'universal'}`);
    lines.push(`KB carregado em: ${date}`);
    lines.push('');

    const typeOrder = ['principle', 'pattern', 'decision', 'refactoring', 'implementation'];
    const typeLabels = {
        principle: 'Princípios ativos',
        pattern: 'Padrões ativos',
        decision: 'Decisões ativas',
        refactoring: 'Refactorings / Lições',
        implementation: 'Implementações ativas',
    };

    for (const type of typeOrder) {
        const entries = grouped[type];
        if (!entries || entries.length === 0) continue;

        lines.push(`### ${typeLabels[type] || type}`);
        lines.push('');

        for (const entry of entries) {
            lines.push(`#### ${entry.title}`);
            lines.push(`> ID: \`${entry.id}\` | Impact: ${entry.impact || 'N/A'} | Status: ${entry.status || 'N/A'}`);
            lines.push('');

            // Incluir conteúdo resumido do arquivo
            const content = loadEntryContent(kbPath, entry);
            if (content) {
                // Extrair apenas as primeiras seções relevantes (até 40 linhas)
                const contentLines = content.split('\n');
                // Pular frontmatter YAML
                let start = 0;
                if (contentLines[0] === '---') {
                    start = contentLines.indexOf('---', 1) + 1;
                }
                const relevant = contentLines.slice(start, start + 40).join('\n').trim();
                if (relevant) {
                    lines.push(relevant);
                    lines.push('');
                }
            }
        }
    }

    return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Summary (versão compacta para exibição rápida)
// ---------------------------------------------------------------------------

function formatSummary(grouped, inferredStacks) {
    const total = Object.values(grouped).flat().length;
    const byType = Object.entries(grouped)
        .map(([type, entries]) => `${entries.length} ${type}(s)`)
        .join(', ');

    return `Mnemonic: ${total} entradas carregadas (${byType}) | Stack: ${inferredStacks.filter(s => s !== 'universal').join(', ') || 'universal'}`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
    const args = process.argv.slice(2);
    const projectDirFlag = args.indexOf('--project-dir');
    const summaryOnly = args.includes('--summary');
    const jsonOutput = args.includes('--json');

    const projectDir = projectDirFlag !== -1
        ? resolve(args[projectDirFlag + 1])
        : resolve('.');

    const config = loadConfig();
    const kbPath = config.kbPath || DEFAULT_KB_PATH;

    // Validações
    if (!existsSync(projectDir)) {
        console.error(`Erro: diretório do projeto não encontrado: ${projectDir}`);
        process.exit(1);
    }

    if (!existsSync(kbPath)) {
        console.error(`Erro: KB não encontrado em: ${kbPath}`);
        console.error(`Execute: node ~/.claude/skills/arch-kb-skill/scripts/update-kb.js`);
        process.exit(1);
    }

    // Executar
    const inferredStacks = inferStacks(projectDir);
    const {entries} = loadIndex(kbPath);
    const relevant = filterEntries(entries, inferredStacks);
    const grouped = groupByType(relevant);

    if (jsonOutput) {
        console.log(JSON.stringify({stacks: inferredStacks, entries: relevant, grouped}, null, 2));
        return;
    }

    if (summaryOnly) {
        console.log(formatSummary(grouped, inferredStacks));
        return;
    }

    console.log(formatContext(grouped, kbPath, inferredStacks));
}

main();
