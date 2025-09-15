const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('💾 Forzando commit en repositorio principal...');

try {
    // Obtener la URL del repositorio con autenticación
    const GH_TOKEN = process.env.GH_TOKEN;
    const GIT_USERNAME = 'DanielRoblesFra'; // Tu nombre de usuario
    const REPO_NAME = 'fondita'; // Tu repositorio principal
    
    // URL con autenticación incluida
    const AUTH_REPO_URL = `https://${GIT_USERNAME}:${GH_TOKEN}@github.com/${GIT_USERNAME}/${REPO_NAME}.git`;
    
    console.log('🔐 Usando URL con autenticación...');

    // Configurar Git
    execSync('git config user.email "render@fondita.com"', { stdio: 'inherit' });
    execSync('git config user.name "Render Bot"', { stdio: 'inherit' });
    
    // Configurar el remote con autenticación
    try {
        execSync(`git remote remove origin`, { stdio: 'inherit' });
    } catch (e) {
        // Ignorar si no existe
    }
    execSync(`git remote add origin ${AUTH_REPO_URL}`, { stdio: 'inherit' });
    
    // Agregar todos los cambios
    execSync('git add -A', { stdio: 'inherit' });
    
    // Remover production-repo si se agregó accidentalmente
    try {
        execSync('git rm --cached production-repo -r -f', { stdio: 'inherit' });
    } catch (e) {
        // Ignorar si no existe
    }
    
    // Verificar si hay cambios
    const status = execSync('git status --porcelain').toString();
    
    if (status.trim() !== '') {
        // Hacer commit
        const commitMessage = `Auto-commit: ${new Date().toLocaleString('es-MX')}`;
        execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
        
        // Hacer push con URL autenticada
        console.log('🚀 Haciendo push con autenticación...');
        execSync(`git push ${AUTH_REPO_URL} main --force`, { stdio: 'inherit' });
        
        console.log('✅ Commit forzado exitosamente');
    } else {
        console.log('✅ No hay cambios para commit');
    }
} catch (error) {
    console.error('❌ Error forzando commit:', error.message);
    // No salir con error para no afectar el flujo principal
}
