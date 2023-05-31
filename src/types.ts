export interface TransformInfo {
  name: string
  result: string
  start: number
  end: number
  order?: string
}

export interface ResolveIdInfo {
  name: string
  result: string
  start: number
  end: number
  order?: string
}

export interface ModuleInfo {
  id: string
  plugins: {
    name: string
    transform?: number
    resolveId?: number
  }[]
}

export interface ModulesList {
  root: string
  modules: ModuleInfo[]
}
