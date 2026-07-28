"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { MoreVerticalIcon, PencilIcon, Trash2Icon } from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useTRPC } from "@/trpc/client"

interface ProjectCardProps {
    project: {
        id: string
        name: string
        updatedAt: Date
    }
}

export const ProjectCard = ({ project }: ProjectCardProps) => {
    const trpc = useTRPC()
    const queryClient = useQueryClient()
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [showRenameDialog, setShowRenameDialog] = useState(false)
    const [newName, setNewName] = useState(project.name)

    const deleteProject = useMutation(trpc.projects.delete.mutationOptions({
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: trpc.projects.getMany.pathKey() })
            toast.success("Project deleted successfully")
            setShowDeleteDialog(false)
        },
        onError: (error) => {
            toast.error(error.message)
        }
    }))

    const renameProject = useMutation(trpc.projects.rename.mutationOptions({
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: trpc.projects.getMany.pathKey() })
            toast.success("Project renamed successfully")
            setShowRenameDialog(false)
        },
        onError: (error) => {
            toast.error(error.message)
        }
    }))

    const handleDelete = () => {
        deleteProject.mutate({ id: project.id })
    }

    const handleRename = (e: React.FormEvent) => {
        e.preventDefault()
        if (newName.trim() && newName !== project.name) {
            renameProject.mutate({ id: project.id, name: newName.trim() })
        }
    }

    return (
        <>
            <div className="relative group">
                <Button
                    variant="outline"
                    className="font-normal h-auto justify-start w-full text-start p-5 hover:shadow-md hover:border-primary/20 transition-all duration-200"
                    asChild
                >
                    <Link href={`/projects/${project.id}`}>
                        <div className="flex items-center gap-x-4 w-full">
                            <div className="shrink-0 p-2 rounded-lg bg-orange-50 dark:bg-orange-950/20 group-hover:bg-orange-100 dark:group-hover:bg-orange-950/40 transition-colors">
                                <Image src="/logo.svg" alt="Logo" width={24} height={24} className="object-contain" />
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                                <h3 className="truncate font-semibold text-base">{project.name}</h3>
                                <p className="text-xs text-muted-foreground">{formatDistanceToNow(project.updatedAt, { addSuffix: true })}</p>
                            </div>
                        </div>
                    </Link>
                </Button>
                <div className="absolute top-2 right-2 hidden sm:block sm:opacity-0 sm:group-hover:opacity-100 transition-opacity pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent">
                                <MoreVerticalIcon className="h-4 w-4" />
                                <span className="sr-only">Project actions</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setNewName(project.name); setShowRenameDialog(true); }}>
                                <PencilIcon className="h-4 w-4 mr-2" />
                                Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                                onClick={() => setShowDeleteDialog(true)}
                                className="text-red-600 focus:text-red-600"
                            >
                                <Trash2Icon className="h-4 w-4 mr-2" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete <span className="font-semibold">{project.name}</span> and all its messages. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleteProject.isPending}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {deleteProject.isPending ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Rename Dialog */}
            <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rename Project</DialogTitle>
                        <DialogDescription>
                            Enter a new name for your project
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleRename}>
                        <Input
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="Project name"
                            maxLength={100}
                            autoFocus
                        />
                        <DialogFooter className="mt-4">
                            <Button type="button" variant="outline" onClick={() => setShowRenameDialog(false)}>
                                Cancel
                            </Button>
                            <Button 
                                type="submit" 
                                disabled={renameProject.isPending || !newName.trim() || newName === project.name}
                            >
                                {renameProject.isPending ? "Renaming..." : "Rename"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    )
}

