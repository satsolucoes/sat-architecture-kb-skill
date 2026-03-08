#!/usr/bin/env node

/**
 * Project Mnemonic — update-kb.js
 * Clona o KB centralizado se não existir, ou faz git pull se já existe.
 */

import {execSync} from 'child_process';
import {existsSync, readFileSync} from 'fs';
import {join} from 'path';
import {homedir} from 'os';

const CONFIG_PATH = join(homedir(), '.claude', 'skills', 'arch-kb-skill', 'config.json');
const DEFAULT_KB_PATH = join(homedir(), '.claude', 'knowledge-bases', 'arch-kb');
const DEFAULT_KB_REPO = 'https://github.com/satsolucoes/sat-architecture-kb.git';

function loadConfig() {
    if (!existsSync(CONFIG_PATH)) return {};
    try {
        return JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
    } catch {
        return {};
    }
}

function exec(cmd, cwd) {
    return execSync(cmd, {cwd, encoding: 'utf-8', stdio: 'pipe'}).trim();
}

function main() {
    const config = loadConfig();
    const kbPath = config.kbPath || DEFAULT_KB_PATH;
    const kbRepo = config.kbRepo || DEFAULT_KB_REPO;

    console.log(`📚 Project Mnemonic — atualizando KB...`);
    console.log(`   Repo: ${kbRepo}`);
    console.log(`   Path: ${kbPath}`);
    console.log('');

    try {
        if (!existsSync(kbPath)) {
            // Primeira vez — clonar
            console.log('🔄 KB não encontrado localmente. Clonando...');
            const parentDir = join(kbPath, '..');
            exec(`mkdir -p "${parentDir}"`);
            exec(`git clone "${kbRepo}" "${kbPath}"`);
            console.log('✅ KB clonado com sucesso.');
        } else {
            // Já existe — fazer pull
            console.log('🔄 Atualizando KB existente...');
            const before = exec('git rev-parse --short HEAD', kbPath);
            exec('git pull --ff-only', kbPath);
            const after = exec('git rev-parse --short HEAD', kbPath);

            if (before === after) {
                console.log('✅ KB já está atualizado.');
            } else {
                console.log(`✅ KB atualizado: ${before} → ${after}`);
            }
        }

        // Mostrar stats do KB
        const indexPath = join(kbPath, 'index.json');
        if (existsSync(indexPath)) {
            const index = JSON.parse(readFileSync(indexPath, 'utf-8'));
            const lastCommit = exec('git log -1 --format="%ad (%ar)" --date=short', kbPath);
            console.log('');
            console.log(`📊 KB stats:`);
            console.log(`   Entradas: ${index.total || index.entries?.length || '?'}`);
            console.log(`   Último commit: ${lastCommit}`);
        }

    } catch (err) {
        console.error('❌ Erro ao atualizar KB:', err.message);
        process.exit(1);
    }
}

main();
