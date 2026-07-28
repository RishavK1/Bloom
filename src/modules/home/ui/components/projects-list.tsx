"use client"

import { useInfiniteQuery } from "@tanstack/react-query"
import { useTRPC } from "@/trpc/client"
import { useUser } from "@clerk/nextjs"
import { Loader2Icon } from "lucide-react"
import { ProjectCard } from "./project-card"
import { ProjectListSkeleton } from "./project-skeleton"
import { Button } from "@/components/ui/button"

const PROJECTS_PAGE_SIZE = 9;

export const ProjectsList = () => {

    const trpc = useTRPC();
    const {user} = useUser();
    const {
        data,
        isLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery(
        trpc.projects.getMany.infiniteQueryOptions(
            { limit: PROJECTS_PAGE_SIZE },
            { getNextPageParam: (lastPage) => lastPage.nextCursor }
        )
    );

    if(!user) return null;

    if(isLoading) {
        return <ProjectListSkeleton />
    }

    const projects = data?.pages.flatMap((page) => page.items) ?? [];

    return (
        <div
            className="w-full bg-white dark:bg-sidebar rounded-xl p-4 sm:p-6 md:p-8 border flex flex-col gap-y-4 sm:gap-y-6"
        >
            <h2 className="text-xl sm:text-2xl font-semibold">{user?.firstName}&apos;s Projects</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {
                    projects.length === 0 && (
                        <div className="col-span-full text-center py-12">
                            <p className="text-sm text-muted-foreground">No projects yet. Create your first one above!</p>
                        </div>
                    )
                }
                {projects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                ))}
            </div>
            {hasNextPage && (
                <div className="flex justify-center pt-2">
                    <Button
                        variant="outline"
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                    >
                        {isFetchingNextPage && <Loader2Icon className="size-4 animate-spin" />}
                        {isFetchingNextPage ? "Loading..." : "Load more"}
                    </Button>
                </div>
            )}
        </div>
    )
}
