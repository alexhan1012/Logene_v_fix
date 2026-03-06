const { contextBridge } = require('electron')

contextBridge.exposeInMainWorld('api', {
  baseURL: 'http://localhost:3001'
})
