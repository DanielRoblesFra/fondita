const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('💾 Forzando commit en repositorio principal...');

try {
    // Obtener la URL del repositorio remoto desde las variables de entorno
    const REPO_URL = process.env.GIT_REPO_URL || 'https://github.com/DanielRoblesFra/fondita.git';
    
    // Configurar Git
    execSync('git config user.email "render@fondita.com"', { stdio: 'inherit' });
    execSync('git config user.name "Render Bot"', { stdio: 'inherit' });
    
    // Configurar el remote 'origin' si no existe
    try {
        execSync('git remote get-url origin', { stdio: 'inherit' });
    } catch (error) {
        console.log('🔧 Configurando remote origin...');
        execSync(`git remote add origin ${REPO_URL}`, { stdio: 'inherit' });
    }
    
    // Agregar todos los cambios (excluyendo production-repo)
    execSync('git add -A', { stdio: 'inherit' });
    
    // Remover accidentalmente production-repo si se agregó
    try {
        execSync('git rm --cached production-repo -r', { stdio: 'inherit' });
    } catch (e) {
        // Ignorar si no existe
    }
    
    // Verificar si hay cambios
    const status = execSync('git status --porcelain').toString();
    
    if (status.trim() !== '') {
        // Hacer commit
        const commitMessage = `Auto-commit: ${new Date().toLocaleString('es-MX')}`;
        execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
        
        // Hacer push con URL completa (más confiable)
        execSync(`git push ${REPO_URL} main`, { stdio: 'inherit' });
        
        console.log('✅ Commit forzado exitosamente');
    } else {
        console.log('✅ No hay cambios para commit');
    }
} catch (error) {
    console.error('❌ Error forzando commit:', error);
    // No salir con error para no afectar el flujo principal
}
