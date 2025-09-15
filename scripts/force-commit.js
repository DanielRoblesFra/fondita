const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('💾 Forzando commit en repositorio principal...');

try {
    // Configurar Git (por si acaso)
    execSync('git config user.email "render@fondita.com"', { stdio: 'inherit' });
    execSync('git config user.name "Render Bot"', { stdio: 'inherit' });
    
    // Agregar todos los cambios
    execSync('git add -A', { stdio: 'inherit' });
    
    // Verificar si hay cambios
    const status = execSync('git status --porcelain').toString();
    
    if (status.trim() !== '') {
        // Hacer commit
        const commitMessage = `Auto-commit: ${new Date().toLocaleString('es-MX')}`;
        execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
        
        // Hacer push
        execSync('git push origin main', { stdio: 'inherit' });
        
        console.log('✅ Commit forzado exitosamente');
    } else {
        console.log('✅ No hay cambios para commit');
    }
} catch (error) {
    console.error('❌ Error forzando commit:', error);
    // No salir con error para no afectar el flujo principal
}
