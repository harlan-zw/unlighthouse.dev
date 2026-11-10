import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { realpathSync } from 'node:fs'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import test from 'node:test'

const root = resolve(import.meta.dirname, '..')
const nuxtRequire = createRequire(realpathSync(resolve(root, 'node_modules/nuxt/package.json')))
const vueTypes = resolve(dirname(nuxtRequire.resolve('vue/package.json')), 'dist/vue.d.ts')
const fixtures: string[] = []

test.afterEach(async () => {
  await Promise.all(fixtures.splice(0).map(path => rm(path, { recursive: true, force: true })))
})

async function check(script: string, template: string, language = 'ts') {
  const cache = resolve(root, 'tools/typecheck/.generated')
  await mkdir(cache, { recursive: true })
  const fixture = await mkdtemp(resolve(cache, 'routes-'))
  fixtures.push(fixture)
  await Promise.all([
    writeFile(resolve(fixture, 'App.vue'), `<script setup lang="${language}">\n${script}\n</script>\n<template>${template}</template>\n`),
    writeFile(resolve(fixture, 'router.ts'), 'interface Routes { docs: { slug: string }; other: { id: string } }\ninterface Pages { "App.vue": { name: "docs" }; "Other.vue": { name: "other" } }\nexport declare function useRoute<Name extends keyof Routes = keyof Routes>(): { params: Routes[Name] }\nexport declare function definePage<Path extends keyof Pages = keyof Pages>(meta: Pages[Path]): void\n'),
    writeFile(resolve(fixture, 'routes.ts'), 'export type _RouteNamesForFilePath<Path extends string> = Path extends "App.vue" ? "docs" : "other"\n'),
    writeFile(resolve(fixture, 'env.d.ts'), 'import type { useRoute as TypedUseRoute, definePage as TypedDefinePage } from "./router"\ndeclare global { const useRoute: typeof TypedUseRoute; const definePage: typeof TypedDefinePage }\n'),
    writeFile(resolve(fixture, 'tsconfig.json'), JSON.stringify({
      compilerOptions: { strict: true, checkJs: true, noEmit: true, module: 'esnext', moduleResolution: 'bundler', target: 'esnext', skipLibCheck: true, types: [], paths: { 'vue': [vueTypes], 'vue-router': ['./router.ts'], 'vue-router/auto-routes': ['./routes.ts'] } },
      include: ['*.ts', '*.vue'],
      vueCompilerOptions: { plugins: [{ name: 'vue-router/volar/sfc-typed-router', options: { rootDir: fixture } }] },
    })),
  ])
  const result = spawnSync(process.execPath, [resolve(root, 'tools/typecheck/check.ts'), '-p', resolve(fixture, 'tsconfig.json')], { cwd: root, encoding: 'utf8', timeout: 15_000 })
  if (result.error)
    throw result.error
  return { status: result.status, output: result.stdout + result.stderr }
}

for (const language of ['ts', 'js']) {
  test(`infers the current route in ${language} scripts and templates`, async () => {
    const result = await check('const route = useRoute()\nconst slug = route.params.slug', '{{ slug }} {{ $route.params.slug }}', language)
    assert.deepEqual(result, { status: 0, output: '' })
  })
}

for (const language of ['ts', 'js']) {
  test(`rejects an unknown current-route parameter in ${language}`, async () => {
    const result = await check('const route = useRoute()\nconsole.log(route.params.missing)', '<span />', language)
    assert.equal(result.status, 2)
    assert.ok(result.output.includes('error TS2339:'))
  })
}

test('rejects an unknown template route parameter', async () => {
  const result = await check('', '{{ $route.params.missing }}')
  assert.equal(result.status, 2)
  assert.ok(result.output.includes('error TS2339:'))
})

test('keeps explicit route type arguments', async () => {
  const result = await check('const route = useRoute<"other">()\nconst id: string = route.params.id', '{{ id }}')
  assert.deepEqual(result, { status: 0, output: '' })
})

test('infers useRoute type queries', async () => {
  const result = await check('type Route = ReturnType<typeof useRoute>\nconst slug: Route["params"]["slug"] = "valid"', '{{ slug }}')
  assert.deepEqual(result, { status: 0, output: '' })
})

test('checks definePage against the current file', async () => {
  const result = await check('definePage({ name: "other" })', '<span />')
  assert.equal(result.status, 2)
  assert.ok(result.output.includes('error TS2322:'))
})

test('checks component props', async () => {
  const result = await check('import { defineComponent } from "vue"\nconst Button = defineComponent({ props: { count: Number } })', '<Button :count="1" />')
  assert.deepEqual(result, { status: 0, output: '' })
})

test('rejects an invalid component prop', async () => {
  const result = await check('import { defineComponent } from "vue"\nconst Button = defineComponent({ props: { count: Number } })', '<Button count="invalid" />')
  assert.equal(result.status, 2)
  assert.ok(result.output.includes('error TS2322:'))
})

test('rejects an unknown component prop', async () => {
  const result = await check('import { defineComponent } from "vue"\nconst Button = defineComponent({ props: { count: Number } })', '<Button unknown />')
  assert.equal(result.status, 2)
  assert.ok(result.output.includes('error TS2353:'))
})

test('rejects script type errors', async () => {
  const result = await check('const count: number = "invalid"', '{{ count }}')
  assert.equal(result.status, 2)
  assert.ok(result.output.includes('error TS2322:'))
})
