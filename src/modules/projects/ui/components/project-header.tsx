import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useSuspenseQuery } from "@tanstack/react-query";

import {
    ChevronDownIcon,
    ChevronLeftIcon,
    SunMoonIcon,
} from "lucide-react";

import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuPortal,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

interface Props {
    projectId: string;
}

export const ProjectHeader = ({ projectId }: Props) => {
    const trpc = useTRPC();

    const { data: project } = useSuspenseQuery(
        trpc.projects.getOne.queryOptions({
            id: projectId,
        })
    )

    const { theme, setTheme } = useTheme();

    return (
        < header className=" p-2 flex items-center justify-between border-2" >
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost"
                        size="sm"
                        className="focus-visible:ring-0 hover:bg-transparent hover:opacity-75 trasition-opacity pl-2! max-w-full">
                        <Image src="/logo.svg" alt="logo" width={18} height={18} className="shrink-0" />
                        <span className="text-sm font-medium truncate">{project.name}</span>
                        <ChevronDownIcon className="shrink-0" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="bottom" align="start">
                    <DropdownMenuItem asChild>
                        <Link href="/">
                            <ChevronLeftIcon />
                            <span>Go to Dashboard</span>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="gap-2">
                            <SunMoonIcon className="size-4 text-muted-foreground" />
                            <span>Appearance</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuSubContent>
                                <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
                                    <DropdownMenuRadioItem value="light">
                                        <span>Light</span>
                                    </DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="dark">
                                        <span>Dark</span>
                                    </DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="system">
                                        <span>System</span>
                                    </DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                            </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                    </DropdownMenuSub>
                    <DropdownMenuSeparator />
                </DropdownMenuContent>
            </DropdownMenu>
        </header >

    )
};