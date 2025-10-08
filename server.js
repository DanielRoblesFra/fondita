// ✅ SOLO cargar dotenv en desarrollo
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

// ✅ Validar variables CRÍTICAS en producción
if (process.env.NODE_ENV === 'production') {
    const requiredVars = ['ADMIN_USER', 'ADMIN_PASS', 'SESSION_SECRET'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
        console.error('❌ ERROR: Variables de entorno faltantes:', missingVars);
        process.exit(1);
    }
    }

const { execSync } = require('child_process');
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// ✅ VARIABLE GLOBAL PARA DATOS DEL MENÚ
let datosMenu = {};

// Cargar datos al iniciar
try {
    const menuPath = path.join(__dirname, 'data', 'menu.json');
    datosMenu = JSON.parse(fs.readFileSync(menuPath, 'utf-8'));
    console.log('📊 Datos del menú cargados al iniciar servidor');
} catch (error) {
    console.error('❌ Error cargando menu.json:', error);
}

// ✅ CONFIGURAR GIT PARA RENDER (SOLUCIÓN AL ERROR)
try {
    execSync('git config user.email "render@fondita.com"', { stdio: 'inherit' });
    execSync('git config user.name "Render Bot"', { stdio: 'inherit' });
    console.log('✅ Configuración de Git establecida para Render');
} catch (error) {
    console.log('⚠️ Error en configuración Git:', error.message);
}

// ✅ INICIALIZAR app PRIMERO
const app = express();
const PORT = process.env.PORT || 3000;

// ✅ MIDDLEWARE de CORS (DESPUÉS de crear app)
app.use((req, res, next) => {
    const allowedOrigins = ['https://fondita.onrender.com', 'https://danielroblesfra.github.io'];
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
    }
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    
    // Forzar HTTPS en producción
    if (process.env.NODE_ENV === 'production') {
        req.connection.encrypted = true;
    }
    
    next();
});
// -------------------- MIDDLEWARES --------------------
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ✅ CONFIGURACIÓN DE SESIÓN (orden correcto)
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    store: new MemoryStore({
        checkPeriod: 86400000
    }),
    cookie: {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 30 * 60 * 1000
    }
}));

// Middleware para rutas protegidas
function isLoggedIn(req, res, next) {
    console.log('🔍 CHECKING SESSION - loggedIn:', req.session.loggedIn);
    if (req.session.loggedIn) {
        next();
    } else {
        res.status(401).send('No autorizado');
    }
}

// -------------------- CONFIGURAR MULTER --------------------
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'img'));
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB máximo
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png/;
        const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimeType = allowedTypes.test(file.mimetype);
        if (extName && mimeType) {
            return cb(null, true);
        } else {
            cb(new Error('Solo se permiten imágenes .jpg, .jpeg o .png'));
        }
    }
});

// Eliminar imágenes antiguas
function deleteOldImage(filename) {
    if (!filename || filename.trim() === '') {
        console.log('ℹ️  No hay nombre de archivo para eliminar');
        return;
    }
    
    const filePath = path.join(__dirname, 'img', filename);
    
    // Verificar que el archivo existe antes de intentar eliminarlo
    if (fs.existsSync(filePath)) {
        fs.unlink(filePath, (err) => {
            if (err) {
                console.log(`⚠️ No se pudo borrar la imagen: ${filename}`, err.message);
            } else {
                console.log(`🗑️ Imagen eliminada localmente: ${filename}`);
            }
        });
    } else {
        console.log(`ℹ️  Imagen no encontrada para eliminar: ${filename}`);
    }
}

// ✅ FUNCIÓN PARA ACTUALIZAR DATOS MENÚ EN MEMORIA
function actualizarDatosMenu() {
    try {
        const menuPath = path.join(__dirname, 'data', 'menu.json');
        datosMenu = JSON.parse(fs.readFileSync(menuPath, 'utf-8'));
        console.log('🔄 Datos del menú actualizados en memoria');
    } catch (error) {
        console.error('❌ Error actualizando datos en memoria:', error);
    }
}

// -------------------- RUTA DE DIAGNÓSTICO --------------------
app.get('/api/git-debug', isLoggedIn, (req, res) => {
    try {
        const results = {
            current_directory: process.cwd(),
            git_remote: execSync('git remote -v').toString(),
            git_status: execSync('git status').toString(),
            last_commits: execSync('git log -5 --oneline').toString(),
            branch_info: execSync('git branch -vv').toString(),
            gh_token_exists: !!process.env.GH_TOKEN,
            prod_repo_url: process.env.PROD_REPO_URL,
            files_in_current_dir: execSync('ls -la').toString()
        };
        res.json(results);
    } catch (error) {
        res.json({ error: error.message, stack: error.stack });
    }
});

// -------------------- RUTAS ESPECÍFICAS --------------------

// ⭐ LOGIN (GET)
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'login.html'));
});

// ⭐ LOGIN (POST con validación de error en la misma página)
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // ✅ DEBUG TEMPORAL
    console.log('🔍 INTENTO DE LOGIN:', {
        expectedUser: process.env.ADMIN_USER,
        expectedPass: process.env.ADMIN_PASS,
        receivedUser: username,
        receivedPass: password,
        match: username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS
    });

    if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
        req.session.loggedIn = true;
        
        // ✅ Guardar sesión MANUALMENTE
        req.session.save((err) => {
            if (err) {
                console.log('❌ Error saving session:', err);
                return res.status(500).send('Error interno');
            }
            
            console.log('✅ Session saved successfully, sessionID:', req.sessionID);
            
            // ✅ Establecer cookie MANUALMENTE
            res.cookie('connect.sid', req.sessionID, {
                httpOnly: true,
                secure: true,
                sameSite: 'none',
                maxAge: 30 * 60 * 1000
            });
            
            console.log('🍪 Cookie header set:', res.getHeaders()['set-cookie']);
            return res.redirect('/admin/index.html');
        });
    } else {
        console.log('❌ LOGIN FALLIDO');
        const loginPath = path.join(__dirname, 'admin', 'login.html');
        let loginPage = fs.readFileSync(loginPath, 'utf-8');

        loginPage = loginPage.replace(
            '<h2>Iniciar Sesión</h2>',
            '<h2>Iniciar Sesión</h2><p class="error">❌ Usuario o contraseña incorrectos</p>'
        );

        res.send(loginPage);
    }
});

// -------------------- LOGOUT --------------------
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error al cerrar sesión:', err);
            return res.status(500).send('No se pudo cerrar sesión');
        }
        res.clearCookie('connect.sid');
        res.redirect('/login');
    });
});

// ⭐ RUTAS PROTEGIDAS
app.get('/admin/index.html', isLoggedIn, (req, res) => {
    console.log('✅ Acceso concedido a panel admin');
    res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

// ⭐ API ROUTES
app.get('/api/menu', (req, res) => {
    const menuPath = path.join(__dirname, 'data', 'menu.json');
    const menu = JSON.parse(fs.readFileSync(menuPath, 'utf-8'));
    res.json(menu);
});

app.post('/api/menu', isLoggedIn, (req, res) => {
    const menuPath = path.join(__dirname, 'data', 'menu.json');
    fs.writeFileSync(menuPath, JSON.stringify(req.body, null, 2));
    
    // ✅ NUEVO: ACTUALIZAR DATOS EN MEMORIA
    actualizarDatosMenu();
    
    // ✅ FORZAR COMMIT MANUAL del menu.json
    try {
        const { execSync } = require('child_process');
        console.log('💾 Guardando menu.json específicamente...');
        
        // Agregar solo el archivo modificado
        execSync('git add data/menu.json', { stdio: 'inherit' });
        
        const status = execSync('git status --porcelain data/menu.json').toString();
        if (status.trim() !== '') {
            const commitMessage = `Actualizar menú: ${new Date().toLocaleString('es-MX')}`;
            execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
            
            // Usar autenticación directa - VERIFICAR QUE GH_TOKEN EXISTA
            const GH_TOKEN = process.env.GH_TOKEN;
            if (!GH_TOKEN) {
                console.error('❌ GH_TOKEN no está definido');
                return res.send('Menú actualizado pero no se pudo guardar en GitHub (token faltante)');
            }
            
            execSync(`git push https://DanielRoblesFra:${GH_TOKEN}@github.com/DanielRoblesFra/fondita.git main`, 
                    { stdio: 'inherit' });
            console.log('✅ Menú guardado en GitHub');
            
            // ✅ NUEVO: SINCRONIZACIÓN AUTOMÁTICA CON FONDITA-PRODUCTION
            console.log('🔄 Iniciando sincronización automática con fondita-production...');
            try {
                execSync('node scripts/sync-to-production.js', { stdio: 'inherit', timeout: 60000 }); // 60 segundos timeout
                console.log('✅ Sincronización automática completada');
            } catch (syncError) {
                console.error('⚠️ Error en sincronización automática:', syncError.message);
                // NO fallar la respuesta principal por error de sync
            }
        }
    } catch (error) {
        console.error('Error en commit del menú:', error);
    }
    
    res.send('Menú actualizado, guardado en GitHub y sincronizado con producción');
});
app.post('/api/upload-image', isLoggedIn, upload.single('imagen'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No se subió ningún archivo');
    }

    console.log('📸 Imagen subida:', req.file.filename);
    console.log('📦 Old filename recibido:', req.body.oldFilename);

    // ✅ CORREGIDO: Eliminar imagen anterior SI existe
    if (req.body.oldFilename && req.body.oldFilename.trim() !== '') {
        deleteOldImage(req.body.oldFilename);
    } else {
        console.log('ℹ️  No hay imagen anterior para eliminar');
    }

    // ✅ EJECUTAR COMMIT ESPECÍFICO PARA LA IMAGEN NUEVA
    try {
        const { execSync } = require('child_process');
        console.log('📸 Guardando imagen en repositorio principal...');
        
        // Agregar específicamente la imagen nueva
        execSync(`git add -f img/${req.file.filename}`, { stdio: 'inherit' });
        
        // ✅ NUEVO: También eliminar la imagen anterior del repositorio Git si existe
        if (req.body.oldFilename && req.body.oldFilename.trim() !== '') {
            try {
                execSync(`git rm -f img/${req.body.oldFilename}`, { stdio: 'inherit' });
                console.log('🗑️  Imagen anterior eliminada del repositorio Git:', req.body.oldFilename);
            } catch (rmError) {
                console.log('ℹ️  Imagen anterior no encontrada en Git:', req.body.oldFilename);
            }
        }
        
        // Verificar si hay cambios en imágenes
        const status = execSync('git status --porcelain img/').toString();
        if (status.trim() !== '') {
            const commitMessage = `Subir imagen: ${req.file.filename}`;
            execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
            
            // Usar autenticación directa
            const GH_TOKEN = process.env.GH_TOKEN;
            if (!GH_TOKEN) {
                console.error('❌ GH_TOKEN no está definido');
                return res.json({ filename: req.file.filename });
            }
            
            execSync(`git push https://DanielRoblesFra:${GH_TOKEN}@github.com/DanielRoblesFra/fondita.git main`, 
                    { stdio: 'inherit' });
            console.log('✅ Imagen guardada en GitHub');
        }
    } catch (error) {
        console.error('Error en commit de imagen:', error.message);
    }

    res.json({ filename: req.file.filename });
});
// -------------------- NUEVO ENDPOINT PARA SINCRONIZACIÓN --------------------
app.post('/api/sync-production', isLoggedIn, (req, res) => {
    console.log('🔁 Solicitada sincronización con repositorio de producción');
    
    try {
        // Ejecutar el script de sincronización
        const { execSync } = require('child_process');
        execSync('node scripts/sync-to-production.js', { stdio: 'inherit' });
        
        res.json({ success: true, message: 'Sincronización completada con éxito' });
    } catch (error) {
        console.error('Error en sincronización:', error);
        res.status(500).json({ success: false, message: 'Error en la sincronización' });
    }
});

// -------------------- ARCHIVOS ESTÁTICOS --------------------
app.use('/admin', express.static(path.join(__dirname, 'admin'), { index: false }));
app.use('/img', express.static(path.join(__dirname, 'img')));
app.use(express.static('public'));

// -------------------- SERVIDOR --------------------
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`));
