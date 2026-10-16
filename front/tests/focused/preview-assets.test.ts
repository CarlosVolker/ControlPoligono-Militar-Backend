import { describe, expect, it, vi } from 'vitest'

import {
  LUCIDE_ARMS_COLLECTION,
  PH_ARMS_COLLECTION,
  PREVIEW_FONT_STYLESHEETS,
  ensurePreviewFontLinks,
} from '../../src/features/appearance/preview-assets'

describe('preview assets (SCREEN-PERSONALIZER)', () => {
  it('exposes the nine catalog font stylesheets with literal DS URLs', () => {
    const entries = Object.entries(PREVIEW_FONT_STYLESHEETS)
    expect(entries).toHaveLength(9)
    expect(PREVIEW_FONT_STYLESHEETS['titillium']).toBe(
      'https://fonts.googleapis.com/css2?family=Titillium+Web:wght@400;500;600;700&display=swap',
    )
    expect(PREVIEW_FONT_STYLESHEETS['geist']).toBe(
      'https://fonts.googleapis.com/css2?family=Geist:wght@100..900&display=swap',
    )
  })

  it('keeps the two custom Iconify collections literal', () => {
    expect(PH_ARMS_COLLECTION.prefix).toBe('ph-arms')
    expect(PH_ARMS_COLLECTION.width).toBe(256)
    expect(PH_ARMS_COLLECTION.height).toBe(256)
    expect(Object.keys(PH_ARMS_COLLECTION.icons).sort()).toEqual([
      'bullet',
      'gun',
      'rifle',
      'shotgun',
    ])
    expect(PH_ARMS_COLLECTION.icons.gun.body).toContain('M56 68h144')

    expect(LUCIDE_ARMS_COLLECTION.prefix).toBe('lucide-arms')
    expect(LUCIDE_ARMS_COLLECTION.width).toBe(24)
    expect(LUCIDE_ARMS_COLLECTION.height).toBe(24)
    expect(LUCIDE_ARMS_COLLECTION.icons.gun.body).toContain('M5 7h12')
  })

  it('preloads the nine stylesheets once and is idempotent', () => {
    document.head.innerHTML = ''
    ensurePreviewFontLinks()
    expect(document.head.querySelectorAll('link[id^="tcfFont-"]')).toHaveLength(9)
    ensurePreviewFontLinks()
    expect(document.head.querySelectorAll('link[id^="tcfFont-"]')).toHaveLength(9)
  })

  it('does not duplicate a stylesheet that already exists by href', () => {
    document.head.innerHTML = ''
    const existing = document.createElement('link')
    existing.rel = 'stylesheet'
    existing.href = PREVIEW_FONT_STYLESHEETS['titillium']
    document.head.appendChild(existing)

    ensurePreviewFontLinks()
    expect(document.getElementById('tcfFont-titillium')).toBeNull()
    expect(document.head.querySelectorAll('link[id^="tcfFont-"]')).toHaveLength(8)
  })

  it('registers both collections through the Iconify fallback without throwing', async () => {
    vi.resetModules()
    const addCollection = vi.fn()
    ;(window as unknown as { Iconify?: unknown }).Iconify = { addCollection }
    const mod = await import('../../src/features/appearance/preview-assets')
    mod.registerPreviewIconCollections()
    expect(addCollection).toHaveBeenCalledTimes(2)
    expect(addCollection.mock.calls.map((call) => call[0].prefix)).toEqual([
      'ph-arms',
      'lucide-arms',
    ])
    mod.registerPreviewIconCollections()
    expect(addCollection).toHaveBeenCalledTimes(2)
  })
})
