import { app, BrowserWindow } from 'electron'
import { fileURLToPath } from 'url'
import path from 'path'
import { startServer } from '../server/index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let mainWindow
let serverInstance

async function createWindow() {
  serverInstance = await startServer()

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 15, y: 10 },
    minWidth: 1000,
    minHeight: 700,
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
