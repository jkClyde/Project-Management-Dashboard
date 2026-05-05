// hooks/useProjects.ts
'use client'

import { useState, useEffect, useCallback, useTransition } from 'react'
import {
    getProjects,
    createProject as createProjectAction,
    updateProject as updateProjectAction,
    archiveProject as archiveProjectAction,
    deleteProject as deleteProjectAction,
} from '@/lib/actions/prisma'
import type { ProjectRow } from '@/lib/actions/prisma'

// REMOVED: import type { ProjectStatus } from '@prisma/client'

type ProjectStatus = ProjectRow['status']  // "active" | "archived" | "completed"

interface UseProjectsOptions {
    status?: ProjectStatus | 'all'
}

export function useProjects({ status = 'all' }: UseProjectsOptions = {}) {
    const [projects, setProjects] = useState<ProjectRow[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    const fetchProjects = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const data = await getProjects(status)
            setProjects(data)
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to load projects')
        } finally {
            setLoading(false)
        }
    }, [status])

    useEffect(() => {
        fetchProjects()
    }, [fetchProjects])

    const createProject = async (input: {
        name: string
        description?: string
        color?: string
        icon?: string
    }) => {
        startTransition(async () => {
            await createProjectAction(input)
            await fetchProjects()
        })
    }

    const updateProject = async (id: string, input: Parameters<typeof updateProjectAction>[1]) => {
        startTransition(async () => {
            await updateProjectAction(id, input)
            await fetchProjects()
        })
    }

    const archiveProject = async (id: string) => {
        startTransition(async () => {
            await archiveProjectAction(id)
            setProjects((prev) =>
                prev.map((p) => (p.id === id ? { ...p, status: 'archived' as const } : p))
            )
        })
    }

    const deleteProject = async (id: string) => {
        startTransition(async () => {
            await deleteProjectAction(id)
            setProjects((prev) => prev.filter((p) => p.id !== id))
        })
    }

    return {
        projects,
        loading: loading || isPending,
        error,
        refetch: fetchProjects,
        createProject,
        updateProject,
        archiveProject,
        deleteProject,
    }
}