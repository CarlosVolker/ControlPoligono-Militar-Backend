<script setup lang="ts">
import { onMounted, onUnmounted, shallowRef, useTemplateRef, watch } from 'vue'
import type { CSSProperties } from 'vue'
import { DESIGN_SYSTEM_AMBIENT } from '../../types/appearance'
import type { DesignSystemAmbient } from '../../types/appearance'
import { useAppearanceStore } from '../../stores/appearance'

const AMBIENT_VARIANTS = [
  DESIGN_SYSTEM_AMBIENT.EMBERS,
  DESIGN_SYSTEM_AMBIENT.FIREFLIES,
  DESIGN_SYSTEM_AMBIENT.RAIN,
  DESIGN_SYSTEM_AMBIENT.SEARCHLIGHTS,
  DESIGN_SYSTEM_AMBIENT.TRACERS,
  DESIGN_SYSTEM_AMBIENT.RICOCHET,
  DESIGN_SYSTEM_AMBIENT.ASH,
  DESIGN_SYSTEM_AMBIENT.OFF,
] as const satisfies readonly DesignSystemAmbient[]

type AmbientVariant = (typeof AMBIENT_VARIANTS)[number]

interface AmbientParticle {
  readonly key: number
  readonly className: string
  readonly style: CSSProperties
}

interface AmbientBuild {
  readonly particles: AmbientParticle[]
  readonly css: string
}

const appearance = useAppearanceStore()
const activeVariant = shallowRef<AmbientVariant | null>(null)
const particles = shallowRef<AmbientParticle[]>([])
const ambientUnitValue = shallowRef(1)
const ambientRoot = useTemplateRef<HTMLDivElement>('ambientRoot')

let ambientStyle: HTMLStyleElement | null = null
let ambientUnitCache = 0

const ROOT_CSS = `#sf-root{
  position: fixed; inset: 0;
  width: calc(100vw / var(--dashboard-scale, 1));
  height: calc(100vh / var(--dashboard-scale, 1));
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}`

function dashboardScale(): number {
  return Number.parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue('--dashboard-scale'),
  ) || 1
}

function ambientUnit(): number {
  if (!ambientUnitCache) ambientUnitCache = 1 / dashboardScale()
  return ambientUnitCache
}

function resolveAmbientVariant(value: string | null): AmbientVariant {
  return AMBIENT_VARIANTS.find((variant) => variant === value) ?? DESIGN_SYSTEM_AMBIENT.EMBERS
}

function makeParticle(
  key: number,
  className: string,
  style: CSSProperties,
): AmbientParticle {
  return { key, className, style }
}

function buildEmbers(u: number): AmbientBuild {
  const k = (value: number) => (value * u).toFixed(1)
  const px = (value: number) => `${value.toFixed(1)}px`
  const nextParticles: AmbientParticle[] = []

  for (let i = 0; i < 24; i += 1) {
    const duration = (Math.random() * 6 + 5).toFixed(1)
    const delay = (-Math.random() * Number(duration)).toFixed(1)
    nextParticles.push(makeParticle(i, 'sf-ember', {
      '--sf-x': `${(Math.random() * 100).toFixed(2)}%`,
      '--sf-y': `${(Math.random() * 26).toFixed(2)}%`,
      '--sf-s': px((Math.random() * 2 + 3.5) * u),
      '--sf-o': (Math.random() * 0.3 + 0.4).toFixed(2),
      animation: `sf-emb${i % 3} ${duration}s linear ${delay}s infinite`,
    }))
  }

  return {
    particles: nextParticles,
    css: `${ROOT_CSS}
#sf-root{
  --sf-a: color-mix(in srgb, var(--ambient-tint, var(--primary)) 75%, rgb(255, 158, 94));
  --sf-b: color-mix(in srgb, var(--ambient-tint, var(--primary)) 65%, rgb(255, 122, 54));
}
.sf-ember{
  position: absolute;
  left: var(--sf-x); bottom: var(--sf-y);
  width: var(--sf-s); height: var(--sf-s);
  border-radius: 50%;
  background: var(--sf-a);
  box-shadow: 0 0 calc(12px * var(--sf-u, 1)) calc(3px * var(--sf-u, 1)) color-mix(in srgb, var(--sf-b) 50%, transparent);
  opacity: 0;
  will-change: transform, opacity;
}
@keyframes sf-emb0{
  0%{ transform: translate3d(0, 0, 0); opacity: 0; }
  8%{ transform: translate3d(${k(14)}px, ${k(-120)}px, 0); opacity: .9; }
  40%{ transform: translate3d(${k(-2)}px, ${k(-260)}px, 0); opacity: .8; }
  72%{ transform: translate3d(${k(8)}px, ${k(-420)}px, 0); opacity: .35; }
  100%{ transform: translate3d(${k(12)}px, ${k(-500)}px, 0); opacity: 0; }
}
@keyframes sf-emb1{
  0%{ transform: translate3d(0, 0, 0); opacity: 0; }
  9%{ transform: translate3d(${k(-16)}px, ${k(-130)}px, 0); opacity: .85; }
  44%{ transform: translate3d(${k(2)}px, ${k(-300)}px, 0); opacity: .72; }
  74%{ transform: translate3d(${k(-10)}px, ${k(-470)}px, 0); opacity: .3; }
  100%{ transform: translate3d(${k(-14)}px, ${k(-580)}px, 0); opacity: 0; }
}
@keyframes sf-emb2{
  0%{ transform: translate3d(0, 0, 0); opacity: 0; }
  11%{ transform: translate3d(${k(8)}px, ${k(-90)}px, 0); opacity: .8; }
  46%{ transform: translate3d(${k(-2)}px, ${k(-200)}px, 0); opacity: .65; }
  76%{ transform: translate3d(${k(4)}px, ${k(-320)}px, 0); opacity: .28; }
  100%{ transform: translate3d(${k(6)}px, ${k(-400)}px, 0); opacity: 0; }
}
@media (prefers-reduced-motion: reduce){
  .sf-ember{ animation: none !important; opacity: var(--sf-o) !important; }
}`,
  }
}

function buildFireflies(u: number): AmbientBuild {
  const k = (value: number) => (value * u).toFixed(1)
  const px = (value: number) => `${value.toFixed(1)}px`
  const nextParticles: AmbientParticle[] = []

  for (let i = 0; i < 18; i += 1) {
    const duration = (Math.random() * 6 + 12).toFixed(1)
    const delay = (-Math.random() * 18).toFixed(1)
    nextParticles.push(makeParticle(i, 'sf-fly', {
      '--sf-x': `${(Math.random() * 100).toFixed(2)}%`,
      '--sf-y': `${(Math.random() * 100).toFixed(2)}%`,
      '--sf-s': px((Math.random() * 1.2 + 3) * u),
      '--sf-o': (Math.random() * 0.25 + 0.3).toFixed(2),
      animation: `sf-fly${i % 3} ${duration}s ease-in-out ${delay}s infinite`,
    }))
  }

  return {
    particles: nextParticles,
    css: `${ROOT_CSS}
#sf-root{
  --sf-a: color-mix(in srgb, var(--ambient-tint, var(--primary)) 75%, rgb(212, 255, 150));
  --sf-b: color-mix(in srgb, var(--ambient-tint, var(--primary)) 65%, rgb(186, 255, 120));
}
.sf-fly{
  position: absolute;
  left: var(--sf-x); top: var(--sf-y);
  width: var(--sf-s); height: var(--sf-s);
  border-radius: 50%;
  background: var(--sf-a);
  box-shadow:
    0 0 calc(7px * var(--sf-u, 1)) calc(2px * var(--sf-u, 1)) color-mix(in srgb, var(--sf-b) 55%, transparent),
    0 0 calc(15px * var(--sf-u, 1)) calc(4px * var(--sf-u, 1)) color-mix(in srgb, var(--sf-a) 28%, transparent);
  opacity: .2;
  will-change: transform, opacity;
}
@keyframes sf-fly0{
  0%{ transform: translate3d(0, 0, 0); opacity: .2; }
  5%{ transform: translate3d(${k(4)}px, ${k(-5)}px, 0); opacity: .92; }
  10%{ transform: translate3d(${k(8)}px, ${k(-9)}px, 0); opacity: .3; }
  30%{ transform: translate3d(${k(-4)}px, ${k(4)}px, 0); opacity: .18; }
  44%{ transform: translate3d(${k(-9)}px, ${k(7)}px, 0); opacity: .82; }
  50%{ transform: translate3d(${k(-12)}px, ${k(9)}px, 0); opacity: .28; }
  74%{ transform: translate3d(${k(-5)}px, ${k(3)}px, 0); opacity: .2; }
  100%{ transform: translate3d(0, 0, 0); opacity: .2; }
}
@keyframes sf-fly1{
  0%{ transform: translate3d(0, 0, 0); opacity: .24; }
  20%{ transform: translate3d(${k(-6)}px, ${k(5)}px, 0); opacity: .95; }
  26%{ transform: translate3d(${k(-10)}px, ${k(8)}px, 0); opacity: .32; }
  48%{ transform: translate3d(${k(5)}px, ${k(-4)}px, 0); opacity: .2; }
  66%{ transform: translate3d(${k(10)}px, ${k(-8)}px, 0); opacity: .8; }
  72%{ transform: translate3d(${k(12)}px, ${k(-11)}px, 0); opacity: .28; }
  90%{ transform: translate3d(${k(4)}px, ${k(-3)}px, 0); opacity: .24; }
  100%{ transform: translate3d(0, 0, 0); opacity: .24; }
}
@keyframes sf-fly2{
  0%{ transform: translate3d(0, 0, 0); opacity: .2; }
  34%{ transform: translate3d(${k(6)}px, ${k(6)}px, 0); opacity: .88; }
  40%{ transform: translate3d(${k(9)}px, ${k(9)}px, 0); opacity: .3; }
  62%{ transform: translate3d(${k(-6)}px, ${k(-5)}px, 0); opacity: .18; }
  82%{ transform: translate3d(${k(-9)}px, ${k(-8)}px, 0); opacity: .72; }
  88%{ transform: translate3d(${k(-11)}px, ${k(-10)}px, 0); opacity: .26; }
  100%{ transform: translate3d(0, 0, 0); opacity: .2; }
}
@media (prefers-reduced-motion: reduce){
  .sf-fly{ animation: none !important; opacity: var(--sf-o) !important; }
}`,
  }
}

function buildRain(u: number): AmbientBuild {
  const px = (value: number) => `${value.toFixed(1)}px`
  const distFar = Math.round((window.innerHeight + 200) * u)
  const distNear = Math.round((window.innerHeight + 260) * u)
  const nextParticles: AmbientParticle[] = []

  for (let i = 0; i < 22; i += 1) {
    const duration = (Math.random() * 1.2 + 2.4).toFixed(2)
    const delay = (-Math.random() * 3.6).toFixed(2)
    nextParticles.push(makeParticle(i, 'sf-drop', {
      '--sf-x': `${(Math.random() * 100).toFixed(2)}%`,
      '--sf-h': px((Math.random() * 15 + 55) * u),
      '--sf-o': (Math.random() * 0.25 + 0.25).toFixed(2),
      animation: `sf-drop0 ${duration}s linear ${delay}s infinite`,
    }))
  }

  for (let i = 0; i < 18; i += 1) {
    const duration = (Math.random() * 0.7 + 1.3).toFixed(2)
    const delay = (-Math.random() * 2).toFixed(2)
    nextParticles.push(makeParticle(i + 22, 'sf-drop', {
      '--sf-x': `${(Math.random() * 100).toFixed(2)}%`,
      '--sf-h': px((Math.random() * 20 + 70) * u),
      '--sf-o': (Math.random() * 0.25 + 0.45).toFixed(2),
      animation: `sf-drop1 ${duration}s linear ${delay}s infinite`,
    }))
  }

  return {
    particles: nextParticles,
    css: `${ROOT_CSS}
#sf-root{
  --sf-b: var(--tcf-grad-2, #a78bfa);
  --sf-rain: color-mix(in srgb, var(--sf-b) 16%, rgb(139, 157, 181));
}
.sf-drop{
  position: absolute;
  left: var(--sf-x);
  top: calc(-110px * var(--sf-u, 1));
  width: calc(1px * var(--sf-u, 1));
  height: var(--sf-h);
  border-radius: 999px;
  background: linear-gradient(to bottom, transparent, var(--sf-rain));
  opacity: var(--sf-o);
  will-change: transform;
}
@keyframes sf-drop0{ 0%{ transform: translate3d(0, 0, 0); } 100%{ transform: translate3d(0, ${distFar}px, 0); } }
@keyframes sf-drop1{ 0%{ transform: translate3d(0, 0, 0); } 100%{ transform: translate3d(0, ${distNear}px, 0); } }
@media (prefers-reduced-motion: reduce){
  .sf-drop{ display: none; }
}`,
  }
}

function buildSearchlights(_u: number): AmbientBuild {
  const leftDuration = (Math.random() * 7 + 18).toFixed(1)
  const leftDelay = (-Math.random() * 12).toFixed(1)
  const rightDuration = (Math.random() * 7 + 18).toFixed(1)
  const rightDelay = (-Math.random() * 12).toFixed(1)

  return {
    particles: [
      makeParticle(0, 'sf-beam sf-beam--l', {
        animation: `sf-beam0 ${leftDuration}s ease-in-out ${leftDelay}s infinite`,
      }),
      makeParticle(1, 'sf-beam sf-beam--r', {
        animation: `sf-beam1 ${rightDuration}s ease-in-out ${rightDelay}s infinite`,
      }),
    ],
    css: `${ROOT_CSS}
#sf-root{ --sf-a: var(--ambient-tint, var(--primary)); }
.sf-beam{
  position: absolute;
  bottom: calc(-180px * var(--sf-u, 1));
  width: calc(460px * var(--sf-u, 1));
  height: calc(145vh / var(--dashboard-scale, 1));
  transform-origin: 50% 100%;
  background: linear-gradient(to top,
    color-mix(in srgb, var(--sf-a) 42%, transparent) 0%,
    color-mix(in srgb, var(--sf-a) 18%, transparent) 40%,
    color-mix(in srgb, var(--sf-a) 6%, transparent) 72%,
    transparent 100%);
  -webkit-mask-image: linear-gradient(to right, transparent, #000 20%, #000 80%, transparent);
  mask-image: linear-gradient(to right, transparent, #000 20%, #000 80%, transparent);
  opacity: .6;
  will-change: transform;
}
.sf-beam--l{ left: calc(14vw - 230px * var(--sf-u, 1)); }
.sf-beam--r{ right: calc(14vw - 230px * var(--sf-u, 1)); }
@keyframes sf-beam0{
  0%, 100%{ transform: rotate(10deg); }
  50%{ transform: rotate(38deg); }
}
@keyframes sf-beam1{
  0%, 100%{ transform: rotate(-10deg); }
  50%{ transform: rotate(-38deg); }
}
@media (prefers-reduced-motion: reduce){
  .sf-beam{ animation: none !important; }
  .sf-beam--l{ transform: rotate(24deg); }
  .sf-beam--r{ transform: rotate(-24deg); }
}`,
  }
}

function buildTracers(u: number): AmbientBuild {
  const k = (value: number) => (value * u).toFixed(1)
  const len = Math.round(220 * u)
  const travel = Math.round((window.innerWidth + 340) * u)
  const x = (fraction: number) => (fraction * travel).toFixed(1)
  const r0 = (-(Math.random() * 4 + 2)).toFixed(1)
  const r1 = (Math.random() * 3).toFixed(1)
  const r2 = (-(Math.random() * 3 + 2)).toFixed(1)
  const r3 = (Math.random() * 4 + 3).toFixed(1)
  const nextParticles: AmbientParticle[] = []
  for (let i = 0; i < 4; i += 1) {
    const y = i === 0
      ? (Math.random() * 4 + 9).toFixed(2)
      : i === 1
        ? (Math.random() * 4 + 11).toFixed(2)
        : i === 2
          ? (Math.random() * 4 + 13).toFixed(2)
          : (Math.random() * 3 + 10).toFixed(2)
    const duration = (Math.random() * 2.5 + 5.5).toFixed(1)
    const delay = (-Math.random() * 8).toFixed(1)
    nextParticles.push(makeParticle(i, 'sf-trace', {
      '--sf-y': `${y}%`,
      animation: `sf-trc${i} ${duration}s linear ${delay}s infinite`,
    }))
  }

  return {
    particles: nextParticles,
    css: `${ROOT_CSS}
#sf-root{
  --sf-a: color-mix(in srgb, var(--ambient-tint, var(--primary)) 80%, rgb(255, 255, 255));
  --sf-h: color-mix(in srgb, var(--sf-a) 45%, rgb(255, 255, 255));
}
html[data-theme="light"] #sf-root{
  --sf-a: color-mix(in srgb, var(--ambient-tint, var(--primary)) 50%, #1f2937);
  --sf-h: color-mix(in srgb, var(--sf-a) 62%, #1f2937);
}
.sf-trace{
  position: absolute;
  left: calc(-260px * var(--sf-u, 1));
  top: var(--sf-y);
  width: ${len}px;
  height: calc(2px * var(--sf-u, 1));
  border-radius: 1px;
  background: linear-gradient(to right, transparent, color-mix(in srgb, var(--sf-a) 22%, transparent) 42%, color-mix(in srgb, var(--sf-a) 60%, transparent) 74%, var(--sf-a) 96%);
  opacity: 0;
  will-change: transform, opacity;
}
.sf-trace::after{
  content: "";
  position: absolute;
  right: calc(-1px * var(--sf-u, 1));
  top: 50%;
  width: calc(5px * var(--sf-u, 1));
  height: calc(5px * var(--sf-u, 1));
  border-radius: 50%;
  transform: translateY(-50%);
  background: var(--sf-h);
  box-shadow:
    0 0 calc(3px * var(--sf-u, 1)) calc(1px * var(--sf-u, 1)) color-mix(in srgb, var(--sf-h) 70%, transparent),
    0 0 calc(12px * var(--sf-u, 1)) calc(3px * var(--sf-u, 1)) color-mix(in srgb, var(--sf-a) 40%, transparent);
}
@keyframes sf-trc0{
  0%{ transform: translate3d(0, 0, 0) rotate(${r0}deg); opacity: 0; }
  4%{ transform: translate3d(${x(0.073)}px, ${k(-4)}px, 0) rotate(${r0}deg); opacity: .95; }
  18%{ transform: translate3d(${x(0.327)}px, ${k(-10)}px, 0) rotate(${r0}deg); opacity: .95; }
  32%{ transform: translate3d(${x(0.582)}px, ${k(-16)}px, 0) rotate(${r0}deg); opacity: .95; }
  38%{ transform: translate3d(${x(0.8)}px, ${k(-20)}px, 0) rotate(${r0}deg); opacity: .85; }
  47.7%{ transform: translate3d(${x(0.927)}px, ${k(-22)}px, 0) rotate(${r0}deg); opacity: .1; }
  55%{ transform: translate3d(${travel}px, ${k(-22)}px, 0) rotate(${r0}deg); opacity: 0; }
  100%{ transform: translate3d(${travel}px, ${k(-22)}px, 0) rotate(${r0}deg); opacity: 0; }
}
@keyframes sf-trc1{
  0%{ transform: translate3d(0, 0, 0) rotate(${r1}deg); opacity: 0; }
  4%{ transform: translate3d(${x(0.073)}px, ${k(3)}px, 0) rotate(${r1}deg); opacity: .85; }
  18%{ transform: translate3d(${x(0.327)}px, ${k(8)}px, 0) rotate(${r1}deg); opacity: .85; }
  32%{ transform: translate3d(${x(0.582)}px, ${k(13)}px, 0) rotate(${r1}deg); opacity: .85; }
  38%{ transform: translate3d(${x(0.8)}px, ${k(16)}px, 0) rotate(${r1}deg); opacity: .85; }
  47.7%{ transform: translate3d(${x(0.927)}px, ${k(17)}px, 0) rotate(${r1}deg); opacity: .1; }
  55%{ transform: translate3d(${travel}px, ${k(17)}px, 0) rotate(${r1}deg); opacity: 0; }
  100%{ transform: translate3d(${travel}px, ${k(17)}px, 0) rotate(${r1}deg); opacity: 0; }
}
@keyframes sf-trc2{
  0%{ transform: translate3d(0, 0, 0) rotate(${r2}deg); opacity: 0; }
  4%{ transform: translate3d(${x(0.073)}px, ${k(-3)}px, 0) rotate(${r2}deg); opacity: .9; }
  18%{ transform: translate3d(${x(0.327)}px, ${k(-9)}px, 0) rotate(${r2}deg); opacity: .9; }
  32%{ transform: translate3d(${x(0.582)}px, ${k(-14)}px, 0) rotate(${r2}deg); opacity: .9; }
  38%{ transform: translate3d(${x(0.8)}px, ${k(-17)}px, 0) rotate(${r2}deg); opacity: .85; }
  47.7%{ transform: translate3d(${x(0.927)}px, ${k(-19)}px, 0) rotate(${r2}deg); opacity: .1; }
  55%{ transform: translate3d(${travel}px, ${k(-19)}px, 0) rotate(${r2}deg); opacity: 0; }
  100%{ transform: translate3d(${travel}px, ${k(-19)}px, 0) rotate(${r2}deg); opacity: 0; }
}
@keyframes sf-trc3{
  0%{ transform: translate3d(0, 0, 0) rotate(${r3}deg); opacity: 0; }
  4%{ transform: translate3d(${x(0.073)}px, ${k(4)}px, 0) rotate(${r3}deg); opacity: .8; }
  18%{ transform: translate3d(${x(0.327)}px, ${k(10)}px, 0) rotate(${r3}deg); opacity: .8; }
  32%{ transform: translate3d(${x(0.582)}px, ${k(16)}px, 0) rotate(${r3}deg); opacity: .8; }
  38%{ transform: translate3d(${x(0.8)}px, ${k(19)}px, 0) rotate(${r3}deg); opacity: .85; }
  47.7%{ transform: translate3d(${x(0.927)}px, ${k(21)}px, 0) rotate(${r3}deg); opacity: .1; }
  55%{ transform: translate3d(${travel}px, ${k(21)}px, 0) rotate(${r3}deg); opacity: 0; }
  100%{ transform: translate3d(${travel}px, ${k(21)}px, 0) rotate(${r3}deg); opacity: 0; }
}
@media (prefers-reduced-motion: reduce){
  .sf-trace{ animation: none !important; opacity: 0 !important; }
}`,
  }
}

function buildRicochet(u: number): AmbientBuild {
  const px = (value: number) => `${value.toFixed(1)}px`
  const nextParticles: AmbientParticle[] = []

  for (let i = 0; i < 12; i += 1) {
    const duration = (Math.random() * 9 + 7).toFixed(1)
    const delay = (-Math.random() * Number(duration)).toFixed(1)
    nextParticles.push(makeParticle(i, 'sf-spark', {
      '--sf-x': `${(Math.random() * 100).toFixed(2)}%`,
      '--sf-y': `${(Math.random() * 100).toFixed(2)}%`,
      '--sf-s': px((Math.random() * 2.5 + 5) * u),
      '--sf-o': (Math.random() * 0.15 + 0.28).toFixed(2),
      animation: `sf-rch${i % 3} ${duration}s linear ${delay}s infinite`,
    }))
  }

  return {
    particles: nextParticles,
    css: `${ROOT_CSS}
#sf-root{
  --sf-a: color-mix(in srgb, var(--ambient-tint, var(--primary)) 75%, rgb(255, 255, 255));
  --sf-b: color-mix(in srgb, var(--ambient-tint, var(--primary)) 80%, rgb(255, 240, 210));
}
html[data-theme="light"] #sf-root{
  --sf-a: color-mix(in srgb, var(--ambient-tint, var(--primary)) 50%, #1f2937);
  --sf-b: color-mix(in srgb, var(--ambient-tint, var(--primary)) 52%, #1f2937);
}
.sf-spark{
  position: absolute;
  left: var(--sf-x); top: var(--sf-y);
  width: var(--sf-s); height: var(--sf-s);
  border-radius: 50%;
  background: radial-gradient(circle at 38% 35%, rgb(255, 255, 255), var(--sf-a) 42%, transparent 74%);
  box-shadow:
    0 0 calc(8px * var(--sf-u, 1)) calc(2px * var(--sf-u, 1)) color-mix(in srgb, var(--sf-b) 55%, transparent),
    0 0 calc(18px * var(--sf-u, 1)) calc(5px * var(--sf-u, 1)) color-mix(in srgb, var(--sf-a) 24%, transparent);
  transform: scale(.1);
  opacity: 0;
  will-change: transform, opacity;
}
@keyframes sf-rch0{
  0%{ transform: scale(.2); opacity: 0; }
  3%{ transform: scale(1); opacity: .95; }
  8%{ transform: scale(.85); opacity: .7; }
  14%{ transform: scale(.1); opacity: 0; }
  100%{ transform: scale(.1); opacity: 0; }
}
@keyframes sf-rch1{
  0%{ transform: scale(.2); opacity: 0; }
  3%{ transform: scale(1); opacity: .85; }
  8%{ transform: scale(.85); opacity: .6; }
  14%{ transform: scale(.1); opacity: 0; }
  100%{ transform: scale(.1); opacity: 0; }
}
@keyframes sf-rch2{
  0%{ transform: scale(.2); opacity: 0; }
  3%{ transform: scale(1); opacity: 1; }
  8%{ transform: scale(.85); opacity: .75; }
  14%{ transform: scale(.1); opacity: 0; }
  100%{ transform: scale(.1); opacity: 0; }
}
@media (prefers-reduced-motion: reduce){
  .sf-spark{ animation: none !important; opacity: var(--sf-o) !important; }
}`,
  }
}

function buildAsh(u: number): AmbientBuild {
  const k = (value: number) => (value * u).toFixed(1)
  const px = (value: number) => `${value.toFixed(1)}px`
  const dist = Math.round((window.innerHeight + 160) * u)
  const nextParticles: AmbientParticle[] = []

  for (let i = 0; i < 20; i += 1) {
    const duration = (Math.random() * 14 + 18).toFixed(1)
    const delay = (-Math.random() * Number(duration)).toFixed(1)
    nextParticles.push(makeParticle(i, 'sf-ash', {
      '--sf-x': `${(Math.random() * 100).toFixed(2)}%`,
      '--sf-s': px((Math.random() * 2 + 3) * u),
      '--sf-o': (Math.random() * 0.25 + 0.25).toFixed(2),
      animation: `sf-ash${i % 3} ${duration}s linear ${delay}s infinite`,
    }))
  }

  return {
    particles: nextParticles,
    css: `${ROOT_CSS}
#sf-root{
  --sf-ash: color-mix(in srgb, var(--ambient-tint, var(--primary)) 40%, rgb(158, 163, 172));
}
.sf-ash{
  position: absolute;
  left: var(--sf-x);
  top: calc(-30px * var(--sf-u, 1));
  width: var(--sf-s); height: var(--sf-s);
  border-radius: 50%;
  background: radial-gradient(circle at 40% 35%, var(--sf-ash), transparent 72%);
  opacity: var(--sf-o);
  will-change: transform;
}
@keyframes sf-ash0{
  0%{ transform: translate3d(0, 0, 0); }
  25%{ transform: translate3d(${k(14)}px, ${k(0.28 * dist)}px, 0); }
  50%{ transform: translate3d(${k(-10)}px, ${k(0.55 * dist)}px, 0); }
  75%{ transform: translate3d(${k(12)}px, ${k(0.82 * dist)}px, 0); }
  100%{ transform: translate3d(0, ${dist}px, 0); }
}
@keyframes sf-ash1{
  0%{ transform: translate3d(0, 0, 0); }
  25%{ transform: translate3d(${k(-16)}px, ${k(0.26 * dist)}px, 0); }
  50%{ transform: translate3d(${k(10)}px, ${k(0.53 * dist)}px, 0); }
  75%{ transform: translate3d(${k(-13)}px, ${k(0.80 * dist)}px, 0); }
  100%{ transform: translate3d(0, ${dist}px, 0); }
}
@keyframes sf-ash2{
  0%{ transform: translate3d(0, 0, 0); }
  25%{ transform: translate3d(${k(9)}px, ${k(0.30 * dist)}px, 0); }
  50%{ transform: translate3d(${k(-14)}px, ${k(0.58 * dist)}px, 0); }
  75%{ transform: translate3d(${k(8)}px, ${k(0.84 * dist)}px, 0); }
  100%{ transform: translate3d(0, ${dist}px, 0); }
}
@media (prefers-reduced-motion: reduce){
  .sf-ash{ animation: none !important; opacity: var(--sf-o) !important; }
}`,
  }
}

function buildAmbient(variant: Exclude<AmbientVariant, 'off'>, u: number): AmbientBuild {
  switch (variant) {
    case DESIGN_SYSTEM_AMBIENT.EMBERS: return buildEmbers(u)
    case DESIGN_SYSTEM_AMBIENT.FIREFLIES: return buildFireflies(u)
    case DESIGN_SYSTEM_AMBIENT.RAIN: return buildRain(u)
    case DESIGN_SYSTEM_AMBIENT.SEARCHLIGHTS: return buildSearchlights(u)
    case DESIGN_SYSTEM_AMBIENT.TRACERS: return buildTracers(u)
    case DESIGN_SYSTEM_AMBIENT.RICOCHET: return buildRicochet(u)
    case DESIGN_SYSTEM_AMBIENT.ASH: return buildAsh(u)
  }
}

function clearAmbient(): void {
  ambientStyle?.remove()
  ambientStyle = null
  particles.value = []
}

function prependAmbientRoot(): void {
  const root = ambientRoot.value
  if (!root || root.parentNode !== document.body || document.body.firstChild === root) return

  document.body.prepend(root)
}

function mountAmbient(variant: AmbientVariant): void {
  if (activeVariant.value === variant) return

  clearAmbient()
  if (variant === DESIGN_SYSTEM_AMBIENT.OFF) {
    activeVariant.value = variant
    return
  }

  const u = ambientUnit()
  const build = buildAmbient(variant, u)
  const style = document.createElement('style')
  style.id = 'sf-css'
  style.setAttribute('data-variant', variant)
  style.textContent = build.css
  document.head.appendChild(style)

  ambientStyle = style
  ambientUnitValue.value = u
  particles.value = build.particles
  activeVariant.value = variant
}

function syncAmbientFromCanonicalDom(): void {
  if (typeof document === 'undefined' || !document.documentElement || !document.head) return
  const requested = resolveAmbientVariant(
    document.documentElement.getAttribute('data-ambient'),
  )
  mountAmbient(requested)
}

// Teleport owns insertion/removal; restore sourceDS's body.prepend order after each mount.
watch(activeVariant, prependAmbientRoot, { flush: 'post' })

// El store aplica los atributos de <html> antes del flush post. Theme y tint
// se re-resuelven en CSS; sólo un cambio de ambient vuelve a crear el engine.
// Esto sustituye boot + darkone:themechange de app.js sin emitir el evento global
// que el prototipo también conecta a su persistencia antigua.
watch(
  () => [
    appearance.snapshot.ambient,
    appearance.snapshot.ambcolor,
    appearance.snapshot.theme,
    appearance.snapshot.accent,
    appearance.snapshot.bg,
  ] as const,
  () => syncAmbientFromCanonicalDom(),
  { flush: 'post' },
)

onMounted(syncAmbientFromCanonicalDom)

onUnmounted(() => {
  clearAmbient()
  activeVariant.value = null
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="activeVariant !== null && activeVariant !== DESIGN_SYSTEM_AMBIENT.OFF"
      :key="activeVariant"
      ref="ambientRoot"
      id="sf-root"
      aria-hidden="true"
      :data-variant="activeVariant"
      :style="{ '--sf-u': String(ambientUnitValue) }"
    >
      <i
        v-for="particle in particles"
        :key="particle.key"
        :class="particle.className"
        :style="particle.style"
      />
    </div>
  </Teleport>
</template>
