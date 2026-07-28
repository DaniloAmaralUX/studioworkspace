import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { api, type ProjectPatch } from '@/lib/api'
import type { Foundation, LauncherKind, Project } from '@/lib/types'

const KEY = ['projects'] as const

export function useProjects() {
  return useQuery({ queryKey: KEY, queryFn: api.listProjects })
}

export function useLaunchers() {
  return useQuery({ queryKey: ['launchers'], queryFn: api.getLaunchers })
}

export function useGithubStatus() {
  return useQuery({
    queryKey: ['github-status'],
    queryFn: api.githubStatus,
    staleTime: 30_000,
  })
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

export function useDeleteProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteProject(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEY })
    },
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

export function useCloneProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.cloneProject(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEY })
    },
  })
}

export function useScaffoldProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      name: string
      parentDir: string
      templateRepoUrl?: string
    }) => api.scaffoldProject(input),
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

export function useProjectGit(id: string, enabled: boolean) {
  return useQuery({
    queryKey: ['git', id],
    queryFn: () => api.getProjectGit(id),
    enabled,
  })
}

export function useFoundation(id: string, enabled: boolean) {
  return useQuery({
    queryKey: ['foundation', id],
    queryFn: () => api.getFoundation(id),
    enabled,
  })
}

export function usePutFoundation(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (f: Foundation) => api.putFoundation(id, f),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['foundation', id] })
    },
  })
}

export function useTemplates() {
  return useQuery({ queryKey: ['templates'], queryFn: api.listTemplates })
}

export function useAddTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { name: string; repoUrl: string; description?: string }) =>
      api.addTemplate(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['templates'] })
    },
  })
}

export function useRemoveTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.removeTemplate(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['templates'] })
    },
  })
}
