const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('💾 Forzando commit en repositorio principal...');

try {
    const GH_TOKEN = process.env.GH_TOKEN;
    const GIT_USERNAME = 'DanielRoblesFra';
    const REPO_NAME = 'fondita';
    const AUTH_REPO_URL = `https://${GIT_USERNAME}:${GH_TOKEN}@github.com/${GIT_USERNAME}/${REPO_NAME}.git`;
    
    console.log('🔐 Configurando Git desde cero...');

    // 1. ✅ CONFIGURAR IDENTIDAD
    execSync('git config user.email "render@fondita.com"', { stdio: 'inherit' });
    execSync('git config user.name "Render Bot"', { stdio: 'inherit' });
    
    // 2. ✅ FORZAR RAMA MAIN (salir del estado detached)
    try {
        execSync('git checkout main', { stdio: 'inherit' });
    } catch (error) {
        console.log('⚠️ Creando rama main...');
        execSync('git checkout -b main', { stdio: 'inherit' });
    }
    
    // 3. ✅ CONFIGURAR REMOTE ORIGIN
    try {
        execSync('git remote remove origin', { stdio: 'inherit' });
    } catch (e) {
        // Ignorar si no existe
    }
    execSync(`git remote add origin ${AUTH_REPO_URL}`, { stdio: 'inherit' });
    
    // 4. ✅ AGREGAR CAMBIOS (excluyendo node_modules)
    execSync('git add -A', { stdio: 'inherit' });
    execSync('git add -A', { stdio: 'inherit' });
    execSync('git add img/', { stdio: 'inherit' });
    execSync('git reset -- node_modules/', { stdio: 'inherit' });
    
    // 5. ✅ VERIFICAR Y HACER COMMIT
    const status = execSync('git status --porcelain').toString();
    
    if (status.trim() !== '') {
        const commitMessage = `Auto-commit: ${new Date().toLocaleString('es-MX')}`;
        execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
        
        // 6. ✅ HACER PUSH CON FUERZA (por el detached head)
        console.log('🚀 Haciendo push forzado...');
        execSync(`git push -f ${AUTH_REPO_URL} main`, { stdio: 'inherit' });
        
        console.log('✅ Commit forzado exitosamente');
    } else {
        console.log('✅ No hay cambios para commit');
    }
} catch (error) {
    console.error('❌ Error forzando commit:', error.message);
}
