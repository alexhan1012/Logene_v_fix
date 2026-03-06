import { unlinkSync } from 'fs'

/**
 * Safely delete a temporary uploaded file, logging any errors.
 * @param {string|null|undefined} filePath
 */
export function cleanupFile(filePath) {
  if (!filePath) return
  try {
    unlinkSync(filePath)
  } catch (err) {
    console.error('Failed to clean up temp file:', err.message)
  }
}
