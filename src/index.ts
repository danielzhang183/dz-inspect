import createDebug from 'debug'
import type { Plugin, ResolvedConfig } from 'vite'

const debug = createDebug('dz-inspect')

export default function (): Plugin {
  let config: ResolvedConfig | undefined

  const transformMap: Record<string, { name?: string; result: string }[]> = {}
  const idMap: Record<string, string> = {}

  function hijackPlugin(plugin: Plugin) {
    if (plugin.transform) {
      debug('hijack plugin transform', plugin.name)
      const _transform = plugin.transform
      plugin.transform = async function (this: any, code: string, id: string) {
        const _result = await _transform.call(this, code, id)
        const result = typeof _result === 'string' ? _result : _result?.code

        if (result != null) {
          if (!transformMap[id])
            transformMap[id] = [{ result: code }]
          transformMap[id].push({ name: plugin.name, result })
        }

        return _result
      }
    }

    if (plugin.load) {
      debug('hijack plugin load', plugin.name)
      const _load = plugin.load
      plugin.load = async function (this: any, ...args: any) {
        const id = args[0]
        const _result = await _load.apply(this, args)
        const result = typeof _result === 'string' ? _result : _result?.code

        if (result != null)
          transformMap[id] = [{ name: plugin.name, result }]

        return _result
      }
    }

    if (plugin.resolveId) {
      debug('hijack plugin resolveId', plugin.name)
      const _resolveId = plugin.resolveId
      plugin.resolveId = async function (this: any, ...args: any[]) {
        const id = args[0]
        const _result = await _resolveId.apply(this, args)

        const result = typeof _result === 'object' ? _result?.id : _result

        if (!id.startsWith('./') && result)
          idMap[id] = result

        return _result
      }
    }
  }

  return {
    name: 'vite-plugin-inspect',
    apply: 'serve',
    configResolved(_config) {
      config = _config
      config.plugins.forEach(hijackPlugin)
    },
    configureServer(server) {
      server.middlewares.use('/__inspect', (req, res) => {
        res.write(JSON.stringify({ transformMap, idMap }))
        res.end()
      })
    },
  }
}
