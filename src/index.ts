import { resolve } from 'path'
import createDebug from 'debug'
import sirv from 'sirv'
import type { ModuleNode, Plugin, ResolvedConfig, ViteDevServer } from 'vite'
import { parseQuery, parseURL } from 'ufo'
import type { ObjectHook } from 'rollup'
import type { ResolveIdInfo, TransformInfo } from './types'

const debug = createDebug('dz-inspect')
const dummyLoadPluginName = '__load__'

type TransformMap = Record<string, TransformInfo[]>
type ResolveIdMap = Record<string, ResolveIdInfo[]>

type HookHandler<T> = T extends ObjectHook<infer F> ? F : T
type HookWrapper<K extends keyof Plugin> = (
  fn: NonNullable<HookHandler<Plugin[K]>>,
  context: ThisParameterType<NonNullable<HookHandler<Plugin[K]>>>,
  args: NonNullable<Parameters<HookHandler<Plugin[K]>>>,
  order: string
) => ReturnType<HookHandler<Plugin[K]>>

export default function (): Plugin {
  let config: ResolvedConfig

  const transformMap: TransformMap = {}
  const idMap: ResolveIdMap = {}

  function hijackHook<K extends keyof Plugin>(plugin: Plugin, name: K, wrapper: HookWrapper<K>) {
    if (!plugin[name])
      return
    debug(`hijack plugin ${name}`)

    // @ts-expect-error future
    let order = plugin.order || plugin.enforce || 'normal'

    const hook = plugin[name]
    if ('handler' in hook) {
      // rollup plugin
      const oldFn = hook.handler
      order += `-${hook.order || hook.enforce || 'normal'}`
      hook.hander = function (this: any, ...args: any) {
        return wrapper(oldFn, this, args, order)
      }
    }
    else if ('transform' in hook) {
      // vite plugin
      const oldFn = hook.transform
      order += `-${hook.order || plugin.enforce || 'normal'}`
      hook.transform = function (this: any, ...args: any) {
        return wrapper(oldFn, this, args, order)
      }
    }
    else {
      const oldFn = hook
      order += `-${hook.order || plugin.enforce || 'normal'}`
      plugin[name] = function (this: any, ...args: any) {
        return wrapper(oldFn, this, args, order)
      }
    }
  }

  function hijackPlugin(plugin: Plugin) {
    hijackHook(plugin, 'transform', async (fn, context, args, order) => {
      const code = args[0]
      const id = args[1]
      const start = Date.now()
      const _result = await fn.apply(context, args)
      const end = Date.now()
      const result = typeof _result === 'string' ? _result : _result?.code

      if (result != null) {
        if (!transformMap[id])
          transformMap[id] = [{ name: dummyLoadPluginName, result: code, start, end: start }]
        transformMap[id].push({ name: plugin.name, result, start, end, order })
      }

      return _result
    })

    hijackHook(plugin, 'load', async (fn, context, args, order) => {
      const id = args[0]
      const start = Date.now()
      const _result = await fn.apply(context, args)
      const end = Date.now()
      const result = typeof _result === 'string' ? _result : _result?.code

      if (result != null)
        transformMap[id] = [{ name: plugin.name, result, start, end, order }]

      return _result
    })

    hijackHook(plugin, 'resolveId', async (fn, context, args) => {
      const id = args[0]
      const start = Date.now()
      const _result = await fn.apply(context, args)
      const end = Date.now()

      const result = typeof _result === 'object' ? _result?.id : _result

      if (result && result !== id) {
        if (!idMap[id])
          idMap[id] = []

        idMap[id].push({ name: plugin.name, result, start, end })
      }

      return _result
    })
  }

  function resolveId(id: string): string {
    return idMap[id]?.[0]
      ? resolveId(idMap[id][0].result)
      : id
  }

  function transformIdMap(idMap: ResolveIdMap) {
    return Object.values(idMap).reduce((map, ids) => {
      ids.forEach((id) => {
        map[id.result] ??= []
        map[id.result].push(id)
      })

      return map
    }, {} as TransformMap)
  }

  function getModulesInfo(transformMap: TransformMap, idMap: ResolveIdMap) {
    const transformedIdMap = transformIdMap(idMap)
    const ids = new Set(Object.keys(transformMap).concat(Object.keys(transformedIdMap)))

    return Array.from(ids).sort()
      .map((id) => {
        const plugins = (transformMap[id] || []).map(transformItem => ({
          name: transformItem.name,
          transform: transformItem.end - transformItem.start,
        })).concat(
          // @ts-expect-error transform is optional
          (transformedIdMap[id] || []).map((idItem) => {
            return { name: idItem.name, resolveId: idItem.end - idItem.start }
          }),
        )

        return {
          id,
          plugins,
        }
      })
  }

  function configureServer(server: ViteDevServer) {
    const _invalidateModule = server.moduleGraph.invalidateModule

    server.moduleGraph.invalidateModule = function (this: any, ...args: any) {
      const mod = args[0] as ModuleNode
      if (mod?.id)
        delete transformMap[mod.id]
      return _invalidateModule.apply(this, args)
    }

    function list() {
      return {
        root: config.root,
        modules: getModulesInfo(transformMap, idMap),
      }
    }

    function getIdInfo(id: string) {
      const resolvedId = resolveId(id)

      return {
        resolvedId,
        transforms: transformMap[resolvedId] || [],
      }
    }

    server.middlewares.use('/__inspect', sirv(resolve(__dirname, 'client'), {
      single: true,
      dev: true,
    }))
    server.middlewares.use('/__inspect_api', (req, res) => {
      const { pathname, search } = parseURL(req.url)
      if (pathname === '/list') {
        res.write(JSON.stringify(list(), null, 2))
        res.end()
      }
      if (pathname === '/id') {
        const id = parseQuery(search).id as string
        res.write(JSON.stringify(getIdInfo(id), null, 2))
        res.end()
      }
    })
  }

  return {
    name: 'vite-plugin-inspect',
    enforce: 'pre',
    apply: 'serve',
    configResolved(_config) {
      config = _config
      config.plugins.forEach(hijackPlugin)
    },
    configureServer(server) {
      configureServer(server)
    },
  }
}
