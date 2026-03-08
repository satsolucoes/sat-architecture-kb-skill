#!/usr/bin/env node

/**
 * Project Mnemonic — record-outcome.js
 * Registra o outcome de uma entrada do KB após uso em sessão real.
 * Atualiza o frontmatter do arquivo e faz commit no repo local.
 */

import {existsSync, readFileSync, writeFileSync} from 'fs';
import {join} from 'path';
import {homedir} from 'os';
import {execSync} from 'child_process';

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

function parseArgs(args) {
    const result = {};
    for (let i = 0; i < args.length; i++) {
        if (args[i].startsWith('--')) {
            result[args[i].replace('--', '')] = args[i + 1];
            i++;
        }
    }
    return result;
}

function updateFrontmatter(content, updates) {
    const lines = content.split('\n');
    if (lines[0] !== '---') return content;

    const endIdx = lines.indexOf('---', 1);
    if (endIdx === -1) return content;

    const frontmatterLines = lines.slice(1, endIdx);
    const body = lines.slice(endIdx + 1);

    // Atualizar ou adicionar campos
    for (const [key, value] of Object.entries(updates)) {
        const idx = frontmatterLines.findIndex(l => l.startsWith(`${key}:`));
        if (idx !== -1) {
            frontmatterLines[idx] = `${key}: ${value}`;
        } else {
            frontmatterLines.push(`${key}: ${value}`);
        }
    }

    return ['---', ...frontmatterLines, '---', ...body].join('\n');
}

function appendSessionNote(content, note, date) {
    const sessionBlock = `\n## Session note (${date})\n${note}\n`;

    // Se já existe seção de notas, adicionar após
    if (content.includes('## Session note')) {
        const lastNoteIdx = content.lastIndexOf('## Session note');
        const nextSection = content.indexOf('\n## ', lastNoteIdx + 1);
        if (nextSection !== -1) {
            return content.slice(0, nextSection) + sessionBlock + content.slice(nextSection);
        }
    }

    return content.trimEnd() + '\n' + sessionBlock;
}

function main() {
    const args = parseArgs(process.argv.slice(2));

    const entryId = args['entry-id'];
    const outcome = args['outcome'];
    const note = args['note'];

    // Validações
    if (!entryId) {
        console.error('Erro: --entry-id é obrigatório');
        console.error('Uso: record-outcome.js --entry-id <id> --outcome <validated|partial|failed> [--note "texto"]');
        process.exit(1);
    }

    if (!outcome || !['validated', 'partial', 'failed'].includes(outcome)) {
        console.error('Erro: --outcome deve ser: validated, partial ou failed');
        process.exit(1);
    }

    const config = loadConfig();
    const kbPath = config.kbPath || DEFAULT_KB_PATH;

    // Encontrar entrada no index
    const indexPath = join(kbPath, 'index.json');
    if (!existsSync(indexPath)) {
        console.error(`Erro: index.json não encontrado em ${kbPath}`);
        process.exit(1);
    }

    const index = JSON.parse(readFileSync(indexPath, 'utf-8'));
    const entry = index.entries.find(e => e.id === entryId);

    if (!entry) {
        console.error(`Erro: entrada '${entryId}' não encontrada no KB`);
        console.error('IDs disponíveis:', index.entries.map(e => e.id).join(', '));
        process.exit(1);
    }

    const filepath = join(kbPath, entry.file);
    if (!existsSync(filepath)) {
        console.error(`Erro: arquivo não encontrado: ${filepath}`);
        process.exit(1);
    }

    // Atualizar arquivo
    let content = readFileSync(filepath, 'utf-8');
    const date = new Date().toISOString().split('T')[0];

    content = updateFrontmatter(content, {
        outcome,
        last_used: date,
    });

    if (note) {
        content = appendSessionNote(content, note, date);
    }

    writeFileSync(filepath, content, 'utf-8');

    // Atualizar index.json também
    const entryInIndex = index.entries.find(e => e.id === entryId);
    if (entryInIndex) {
        entryInIndex.outcome = outcome;
        entryInIndex.last_used = date;
        writeFileSync(indexPath, JSON.stringify(index, null, 2) + '\n', 'utf-8');
    }

    // Commit no KB local
    try {
        execSync('git add -A', {cwd: kbPath, stdio: 'pipe'});
        const msg = `outcome(${entryId}): ${outcome}${note ? ` — ${note.slice(0, 60)}` : ''}`;
        execSync(`git commit -m "${msg}"`, {cwd: kbPath, stdio: 'pipe'});
        console.log(`✅ Outcome registrado: ${entryId} → ${outcome}`);
        console.log(`   Commit: ${msg}`);
    } catch (err) {
        // Commit falhou mas arquivo foi salvo — não é erro crítico
        console.log(`✅ Outcome salvo no arquivo: ${entryId} → ${outcome}`);
        console.log(`⚠️  Commit automático falhou (pode commitar manualmente): ${err.message}`);
    }
}

main();
