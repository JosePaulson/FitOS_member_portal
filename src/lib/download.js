// Saves an axios blob response (responseType: 'blob') as a file download.
export function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// Errors from a blob request arrive as a Blob too — read the server's JSON message out of it.
export async function blobErrorMessage(err, fallback = 'Download failed') {
  try {
    const data = err?.response?.data
    if (data instanceof Blob) return JSON.parse(await data.text()).message || fallback
    return data?.message || fallback
  } catch { return fallback }
}
