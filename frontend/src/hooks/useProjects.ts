import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { api, type ProjectPatch } from '@/lib/api'
import type { LauncherKind, Project } from '@/lib/types'

const KEY = ['projects'] as const

export function useProjects() {
  return useQuery({ queryKey: KEY, queryFn: api.listProjects })
}

export function useLaunchers() {
  return useQuery({ queryKey: ['launchers'], queryFn: api.getLaunchers })
}

export function usePatchProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: ProjectPatch }) =>
      api.patchProject(id, patch),
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: KEY })
      const prev = qc.getQueryData<Project[]>(KEY)
      qc.setQueryData<Project[]>(KEY, (list) =>
        list?.map((p) => (p.id === id ? { ...p, ...patch } : p)),
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(KEY, ctx.prev)
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: KEY })
    },
  })
}

export function useOpenProject() {
  return useMutation({
    mutationFn: ({ id, withTool }: { id: string; withTool: LauncherKind }) =>
      api.openProject(id, withTool),
  })
}

export function useAddLocalProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ path, name }: { path: string; name?: string }) =>
      api.addLocalProject(path, name),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEY })
    },
  })
}

export function useAddGithubProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (nameWithOwner: string) => api.addGithubProject(nameWithOwner),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEY })
    },
  })
}

export function useGithubRepos(enabled: boolean) {
  return useQuery({
    queryKey: ['github-repos'],
    queryFn: api.listGithubRepos,
    enabled,
    staleTime: 60_000,
  })
}
