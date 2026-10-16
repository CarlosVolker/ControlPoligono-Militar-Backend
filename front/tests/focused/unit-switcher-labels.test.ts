import { createApp, h, nextTick, type App } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'
import UnitSwitcher from '../../src/components/shell/UnitSwitcher.vue'

const apps: Array<{ app: App; host: HTMLElement }> = []

afterEach(() => {
  for (const { app, host } of apps.splice(0)) {
    app.unmount()
    host.remove()
  }
})

async function mountSwitcher(props: Record<string, unknown>): Promise<HTMLElement> {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const app = createApp({ render: () => h(UnitSwitcher, props) })
  app.mount(host)
  await nextTick()
  apps.push({ app, host })
  return host
}

function optionLabels(host: HTMLElement): string[] {
  return [...host.querySelectorAll('option')]
    .filter((option) => option.value !== '')
    .map((option) => option.textContent?.trim() ?? '')
}

describe('UnitSwitcher: nombres de unidad y espera del 429', () => {
  it('rotula con el nombre cuando el contexto lo expone y deja el código como apoyo', async () => {
    const host = await mountSwitcher({
      unitCodes: ['unit-a', 'unit-b'],
      activeUnitCode: 'unit-b',
      busy: false,
      unitNames: { 'unit-a': 'Compañía A' },
    })

    expect(optionLabels(host)).toEqual(['Compañía A (unit-a)', 'unit-b'])
  })

  it('sin nombre disponible rotula con el código, sin inventarlo', async () => {
    const host = await mountSwitcher({
      unitCodes: ['unit-c'],
      activeUnitCode: null,
      busy: false,
      unitNames: { 'unit-a': 'Compañía A' },
    })

    expect(optionLabels(host)).toEqual(['unit-c'])
  })

  it('junto al estado deshabilitado anuncia la espera en segundos', async () => {
    const host = await mountSwitcher({
      unitCodes: ['unit-a'],
      activeUnitCode: 'unit-a',
      busy: true,
      cooldownSeconds: 12,
    })

    const select = host.querySelector<HTMLSelectElement>('select')
    const message = host.querySelector<HTMLElement>('#shell-unit-switcher-cooldown')

    expect(select?.disabled).toBe(true)
    expect(select?.getAttribute('aria-describedby')).toBe('shell-unit-switcher-cooldown')
    expect(message?.textContent?.trim()).toBe('Disponible en 12 s')
  })

  it('sin espera no hay mensaje', async () => {
    const host = await mountSwitcher({
      unitCodes: ['unit-a'],
      activeUnitCode: 'unit-a',
      busy: false,
    })

    expect(host.querySelector('#shell-unit-switcher-cooldown')).toBeNull()
    expect(host.querySelector('select')?.getAttribute('aria-describedby')).toBeNull()
  })
})
