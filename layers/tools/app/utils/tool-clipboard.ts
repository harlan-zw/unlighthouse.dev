export type ClipboardRead
  = { _tag: 'Ok', text: string }
    | { _tag: 'Err', message: string }

export async function readClipboardText(): Promise<ClipboardRead> {
  try {
    const text = await navigator.clipboard.readText()
    return { _tag: 'Ok', text }
  }
  catch {
    return { _tag: 'Err', message: 'Clipboard access was denied. Paste your URLs with Ctrl+V instead.' }
  }
}
