import { useState } from "react";
import { Fragment } from "@prisma/client";
import { ExternalLinkIcon, MonitorIcon, RefreshCcwIcon, SmartphoneIcon, TabletIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Hint } from "@/components/hint";
import { cn } from "@/lib/utils";

interface Props {
    data: Fragment;
}

type Viewport = "desktop" | "tablet" | "mobile";

const VIEWPORTS: { id: Viewport; label: string; icon: typeof MonitorIcon; width: number | null }[] = [
    { id: "desktop", label: "Desktop", icon: MonitorIcon, width: null },
    { id: "tablet", label: "Tablet", icon: TabletIcon, width: 768 },
    { id: "mobile", label: "Mobile", icon: SmartphoneIcon, width: 390 },
];

export const FragmentWeb = ({ data }: Props) => {
    const [copied, setCopied] = useState(false);
    const [fragmentKey, setFragmentKey] = useState(0);
    const [viewport, setViewport] = useState<Viewport>("desktop");
     const onRefresh = () => {
        setFragmentKey((prev) => prev + 1);
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(data.sandboxUrl ?? "");
        setCopied(true);
        setTimeout(() => {
            setCopied(false);
        }, 2000);
    }

    const activeViewport = VIEWPORTS.find((v) => v.id === viewport) ?? VIEWPORTS[0];

    return (
        <div className="flex flex-col w-full h-full">
            <div className="p-2 border-b bg-sidebar flex flex-wrap items-center gap-2">
                <Hint text="Refresh" side="bottom" align="start">
                <Button size="sm" variant="outline" onClick={ onRefresh }>
                    <RefreshCcwIcon />
                </Button>
                </Hint>
                <Button
                    size="sm"
                    variant="outline"
                    onClick={ handleCopy }
                    disabled={!data.sandboxUrl || copied}
                    className="flex-1 min-w-24 justify-start text-start font-normal"
                >
                    <span className="truncate">
                        {copied ? "Copied!" : data.sandboxUrl}
                    </span>
                </Button>
                <div className="flex items-center gap-x-0.5 border rounded-md p-0.5">
                    {VIEWPORTS.map((v) => (
                        <Hint key={v.id} text={v.label} side="bottom">
                            <Button
                                type="button"
                                size="icon"
                                variant={viewport === v.id ? "default" : "ghost"}
                                className="size-7"
                                onClick={() => setViewport(v.id)}
                            >
                                <v.icon className="size-4" />
                                <span className="sr-only">{v.label}</span>
                            </Button>
                        </Hint>
                    ))}
                </div>
                <Hint text="Open in new tab" side="bottom" align="start">
                <Button
                    size="sm"
                    disabled={!data.sandboxUrl}
                    variant="outline"
                    onClick={() => {
                        if (!data.sandboxUrl) return;
                        window.open(data.sandboxUrl, "_blank");
                    }}

                >
                    <ExternalLinkIcon />
                </Button>
                </Hint>
            </div>
            <div className="flex-1 min-h-0 overflow-auto bg-muted/30 dark:bg-black/20 flex justify-center">
                <div
                    className={cn(
                        "h-full w-full bg-background transition-[width] duration-200",
                        activeViewport.width && "border-x shadow-sm"
                    )}
                    style={activeViewport.width ? { width: activeViewport.width, maxWidth: "100%" } : undefined}
                >
                    <iframe
                        key={fragmentKey}
                        className="h-full w-full"
                        sandbox="allow-forms allow-scripts allow-same-origin"
                        loading="lazy"
                        src={data.sandboxUrl ?? ""}
                    ></iframe>
                </div>
            </div>
        </div>
    )
}
