import { createApp, h, nextTick, type App } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'
import AccuracyProgress from '../../src/components/AccuracyProgress.vue'

type SummaryStatus = 'idle' | 'loading' | 'ready' | 'empty' | 'denied' | 'error'

interface SummaryDoubles {
  tiros_total?: number | null
  tiros_acertados_total?: number | null
}

const mounted: Array<{ app: App; host: HTMLElement }> = []

afterEach(() => {
  for (const { app, host } of mounted.splice(0)) {
    app.unmount()
    host.remove()
  }
})

async function mountAccuracy(
  summary: SummaryDoubles | null,
  status: SummaryStatus = 'ready',
): Promise<HTMLElement> {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const app = createApp({
    render: () => h(AccuracyProgress, { summary, status }),
  })
  app.mount(host)
  await nextTick()
  mounted.push({ app, host })
  return host
}

function scoreValue(host: HTMLElement): string | null {
  return host.querySelector('.accuracy-value')?.textContent?.trim() ?? null
}

describe('AccuracyProgress: proporción sin disparos', () => {
  it('sin disparos: cifra en —, etiqueta honesta y sin riel de progreso fabricado', async () => {
    const host = await mountAccuracy({ tiros_total: 0, tiros_acertados_total: 0 })
    const text = host.textContent ?? ''

    expect(scoreValue(host)).toBe('—')
    expect(text).toContain('Sin disparos registrados')
    // Ni la fracción 0/0 ni el 0% se fabrican en la superficie.
    expect(text).not.toContain('0 de 0')
    expect(text).not.toContain('%')
    expect(host.querySelector('[role="progressbar"]')).toBeNull()
  })

  it('con disparos: porcentaje real, conteo y riel con valor accesible', async () => {
    const host = await mountAccuracy({ tiros_total: 10, tiros_acertados_total: 5 })
    const progress = host.querySelector('[role="progressbar"]')

    expect(scoreValue(host)).toBe('50%')
    expect(host.textContent ?? '').toContain('5 de 10 disparos')
    expect(progress).not.toBeNull()
    expect(progress?.getAttribute('aria-valuenow')).toBe('50')
  })

  it('sin resumen consolidado: — y ningún riel', async () => {
    const host = await mountAccuracy(null)

    expect(scoreValue(host)).toBe('—')
    expect(host.querySelector('[role="progressbar"]')).toBeNull()
  })
})
