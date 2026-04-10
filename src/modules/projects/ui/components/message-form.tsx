import { z } from "zod";
import { toast } from "sonner"
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import TextAreaAutosize from "react-textarea-autosize";
import { ArrowUpIcon, Loader2Icon, SparklesIcon } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Form, FormField } from "@/components/ui/form";
import { useState, useEffect } from "react";
import { Usage } from "./usage";
import { useRouter } from "next/navigation";
interface Props {
    projectId: string;
    quickActionPrompt?: string;
    onQuickActionUsed?: () => void;
}

const formSchema = z.object({
    value: z.string()
        .min(1, "Message is required")
        .max(10000, "Message is too long"),
});
export const MessageForm = ({ projectId, quickActionPrompt, onQuickActionUsed }: Props) => {

    const trpc = useTRPC();
    const router = useRouter();
    const queryClient = useQueryClient();

    const {data: usage} = useQuery(trpc.usage.status.queryOptions());

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            value: "",
        },
    });

    // Handle quick action prompt
    useEffect(() => {
        if (quickActionPrompt) {
            form.setValue("value", quickActionPrompt, {
                shouldValidate: true,
                shouldDirty: true,
                shouldTouch: true,
            });
            onQuickActionUsed?.();
        }
    }, [quickActionPrompt, form, onQuickActionUsed]);
    const createMessage = useMutation(trpc.messages.create.mutationOptions({
        onSuccess: () => {
            form.reset();
            queryClient.invalidateQueries(
                trpc.messages.getMany.queryOptions({ projectId })
            );
            queryClient.invalidateQueries(trpc.usage.status.queryOptions());
        },
        onError: (error) => {
            toast.error(error.message);
            if (error.data?.code === "TOO_MANY_REQUESTS") {
                router.push("/pricing");
            }
        }
    }))
    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        await createMessage.mutateAsync({
            value: values.value,
            projectId,

        });
    }
    const [isFocused, setIsFocused] = useState(false);
    const [isEnhancing, setIsEnhancing] = useState(false);
    const showUsage = !!usage;

    const enhancePrompt = useMutation(trpc.promptEnhancer.enhance.mutationOptions({
        onSuccess: (data) => {
            const enhancedPrompt = data.enhanced.trim();
            form.setValue("value", enhancedPrompt, {
                shouldDirty: true,
                shouldTouch: true,
                shouldValidate: true,
            });
            toast.success("Prompt updated in input");
            setIsEnhancing(false);
        },
        onError: () => {
            toast.error("Failed to enhance prompt");
            setIsEnhancing(false);
        }
    }));

    const handleEnhance = async () => {
        const currentValue = form.getValues("value");
        if (!currentValue.trim()) {
            toast.error("Please enter a prompt first");
            return;
        }
        setIsEnhancing(true);
        await enhancePrompt.mutateAsync({ prompt: currentValue });
    };

    const isPending = createMessage.isPending;
    const isButtonDisabled = isPending || !form.formState.isValid;
    return (
        <Form {...form}>
            {showUsage && (
                <Usage points={usage.remainingPoints} msBeforeNext={usage.msBeforeNext} />
            )}
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className={cn(
                    "relative border p-4 pt-1 rounded-xl bg-sidebar dark:bg-sidebar transition-all",
                    isFocused && "shadow-xs",
                    showUsage && "rounded-t-tone",
                )}
            >
                <FormField
                    control={form.control}
                    name="value"
                    render={({ field }) => (
                        <TextAreaAutosize
                            {...field}
                            disabled={isPending}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            minRows={2}
                            maxRows={8}
                            className="pt-4 resize-none border-none w-full outline-none bg-transparent"
                            placeholder="What do you want to build?"
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                                    e.preventDefault();
                                    form.handleSubmit(onSubmit)(e);
                                }
                            }}
                        />
                    )}
                />
                <div className="flex gap-x-2 items-end justify-between pt-2">
                    <div className="text-[10px] text-muted-foreground font-mono">
                        <kbd className="mt-auto pointer-events-none inline-flex h-5 
                        select-none items-center gap-1 rounded-border bg-muted px-1.5 font-mono
                        text-[10px] font-medium text-muted-foreground
                         ">
                            <span>&#8984;</span>Enter
                        </kbd>
                        &nbsp;to send
                    </div>
                    <div className="flex gap-x-2">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={handleEnhance}
                            disabled={isPending || isEnhancing || !form.getValues("value").trim()}
                            className="size-8 rounded-full"
                            title="Enhance prompt with AI"
                        >
                            {isEnhancing ? (
                                <Loader2Icon className="size-4 animate-spin" />
                            ) : (
                                <SparklesIcon className="size-4" />
                            )}
                        </Button>
                        <Button
                            disabled={isButtonDisabled}
                            className={cn(
                                "size-8 rounded-full",
                                isButtonDisabled && "bg-muted-foreground border"
                            )}>
                            {
                                isPending ?
                                    <Loader2Icon className="size-4 animate-spin" />
                                    :
                                    <ArrowUpIcon className="size-4" />
                            }
                        </Button>
                    </div>
                </div>
            </form>
        </Form>
    )
}
