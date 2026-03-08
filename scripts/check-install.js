#!/usr/bin/env node

/**
 * Project Mnemonic — check-install.js
 * Verifica se a skill e o KB estão instalados e configurados corretamente.
 */

import {existsSync, readFileSync} from 'fs';
import {join} from 'path';
import {homedir} from 'os';
import {execSync} from 'child_process';

const SKILL_PATH = join(homedir(), '.claude', 'skills', 'arch-kb-skill');
const CONFIG_PATH = join(SKILL_PATH, 'config.json');
const DEFAULT_KB_PATH = join(homedir(), '.claude', 'knowledge-bases', 'arch-kb');

function check(label, condition, fix) {
    if (condition) {
        console.log(`  ✅ ${label}`);
        return true;
    } else {
        console.log(`  ❌ ${label}`);
        if (fix) console.log(`     → ${fix}`);
        return false;
    }
}

function main() {
    console.log('🔍 Project Mnemonic — verificando instalação...\n');

    let ok = true;

    // Node version
    const nodeVersion = parseInt(process.version.replace('v', '').split('.')[0]);
    ok = check(
        `Node.js >= 18 (atual: ${process.version})`,
        nodeVersion >= 18,
        'Instale Node.js 18+ em https://nodejs.org'
    ) && ok;

    // Skill instalada
    ok = check(
        `Skill instalada em ${SKILL_PATH}`,
        existsSync(SKILL_PATH),
        `git clone https://github.com/satsolucoes/sat-architecture-kb-skill.git "${SKILL_PATH}"`
    ) && ok;

    // SKILL.md presente
    ok = check(
        'SKILL.md presente',
        existsSync(join(SKILL_PATH, 'SKILL.md')),
        'Reinstale a skill'
    ) && ok;

    // Scripts presentes
    const scripts = ['query.js', 'update-kb.js', 'record-outcome.js', 'check-install.js'];
    for (const script of scripts) {
        ok = check(
            `Script: ${script}`,
            existsSync(join(SKILL_PATH, 'scripts', script)),
            'Reinstale a skill'
        ) && ok;
    }

    // Config
    const configExists = existsSync(CONFIG_PATH);
    check(
        `config.json presente`,
        configExists,
        `Copie o config.example.json: cp "${join(SKILL_PATH, 'config.example.json')}" "${CONFIG_PATH}"`
    );

    // KB path
    let kbPath = DEFAULT_KB_PATH;
    if (configExists) {
        try {
            const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
            if (config.kbPath) kbPath = config.kbPath;
        } catch { /* ignorar */
        }
    }

    const kbExists = existsSync(kbPath);
    ok = check(
        `KB encontrado em ${kbPath}`,
        kbExists,
        `node "${join(SKILL_PATH, 'scripts', 'update-kb.js')}"`
    ) && ok;

    if (kbExists) {
        // index.json presente
        ok = check(
            'index.json no KB',
            existsSync(join(kbPath, 'index.json')),
            'Verifique se o repo do KB está completo'
        ) && ok;

        // Git disponível
        try {
            execSync('git --version', {stdio: 'pipe'});
            check('Git disponível', true);
        } catch {
            ok = check('Git disponível', false, 'Instale Git em https://git-scm.com') && ok;
        }
    }

    console.log('');

    if (ok) {
        console.log('✅ Tudo certo! Project Mnemonic pronto para uso.\n');
        process.exit(0);
    } else {
        console.log('❌ Corrija os problemas acima antes de usar o Mnemonic.\n');
        process.exit(1);
    }
}

main();
