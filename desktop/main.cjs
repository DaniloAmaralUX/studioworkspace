// Electron main: sobe o backend Fastify (servindo o frontend na mesma origem)
// e abre a janela em http://127.0.0.1:5178. Local-only, como o Studio desktop.
const { app, BrowserWindow, shell } = require('electron')
const path = require('node:path')
const { startServer } = require('./dist/backend.cjs')

const HOST = '127.0.0.1'
const PORT = 5178

function staticDir() {
  // Empacotado: frontend/dist vai para resources/frontend-dist (extraResources).
  // Dev: usa o build local em ../frontend/dist.
  return app.isPackaged
    ? path.join(process.resourcesPath, 'frontend-dist')
    : path.join(__dirname, '..', 'frontend', 'dist')
}

let server = null

async function boot() {
  try {
    server = await startServer({ host: HOST, port: PORT, staticDir: staticDir() })
  } catch (err) {
    // Porta ocupada (ex.: Studio já rodando) — segue e tenta abrir mesmo assim.
    console.error('backend:', err && err.message)
  }

  const win = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0b0b0e',
    title: 'Studio',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  // Links externos abrem no navegador padrão, não numa janela Electron.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) shell.openExternal(url)
    return { action: 'deny' }
  })

  win.loadURL(`http://${HOST}:${PORT}/`)
}

app.whenReady().then(boot)

app.on('window-all-closed', () => {
  app.quit()
})

app.on('before-quit', async () => {
  try {
    await server?.close()
  } catch {
    /* já fechado */
  }
})
