"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  dropTargetForElements,
  monitorForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { toast } from "sonner";
import {
  CheckCircle2,
  ExternalLink,
  LucideEdit,
  PlusCircle,
} from "lucide-react";
import { type FunnelPage } from "@prisma/client";

import { upsertFunnelPage } from "@/lib/queries";

import { useModal } from "@/providers/modal-provider";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import CreateFunnel from "@/components/forms/create-funnel";
import FunnelPagePlaceholder from "@/components/icons/funnel-page-placeholder";
import FunnelStepCard from "./funnel-stepcard";

import { type FunnelsForSubAccount } from "@/lib/types";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface FunnelStepsProps {
  funnel: FunnelsForSubAccount;
  initialPages: FunnelPage[];
  subAccountId: string;
  funnelId: string;
}

const FunnelSteps: React.FC<FunnelStepsProps> = ({
  funnel,
  funnelId,
  initialPages,
  subAccountId,
}) => {
  const { setOpen } = useModal();
  const [clickedPage, setClickedPage] = React.useState<FunnelPage | undefined>(
    initialPages[0]
  );
  const [currentPages, setCurrentPages] =
    React.useState<FunnelPage[]>(initialPages);

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Drop zone component for insertion points
  const DropZone = ({ index }: { index: number }) => {
    const dropZoneRef = useRef<HTMLDivElement | null>(null);
    const [isOver, setIsOver] = useState(false);

    useEffect(() => {
      const element = dropZoneRef.current;
      if (!element) return;

      return dropTargetForElements({
        element,
        getData: () => ({ type: "funnel-drop-zone", index }),
        canDrop: ({ source }) => source.data.type === "funnel-page",
        onDragEnter: () => setIsOver(true),
        onDragLeave: () => setIsOver(false),
        onDrop: () => setIsOver(false),
      });
    }, [index]);

    return (
      <div
        ref={dropZoneRef}
        className={`w-full h-3 transition-all my-1 ${
          isOver
            ? "bg-blue-500/40 border-2 border-blue-500 border-dashed"
            : "bg-transparent"
        }`}
      />
    );
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    return dropTargetForElements({
      element: el,
      getData: () => ({ type: "funnels-container" }),
      canDrop: ({ source }) => source.data.type === "funnel-page",
    });
  }, []);

  useEffect(() => {
    return monitorForElements({
      onDrop({ source, location }) {
        const destination = location.current.dropTargets[0];
        if (!destination) return;

        const sourceData = source.data;
        const destinationData = destination.data;

        // Only handle funnel-page moves within the funnel container
        if (
          sourceData.type === "funnel-page" &&
          destinationData.type === "funnels-container"
        ) {
          const sourceIndex = sourceData.index as number;

          // Determine new index from drop targets (find funnel-page drop zones)
          let targetIndex = currentPages.length;
          for (const t of location.current.dropTargets) {
            if (t.data?.type === "funnel-drop-zone") {
              targetIndex = t.data.index as number;
              break;
            }
          }

          if (sourceIndex === targetIndex) return;

          const newPagesOrder = [...currentPages];
          const [moved] = newPagesOrder.splice(sourceIndex, 1);
          newPagesOrder.splice(
            targetIndex > sourceIndex ? targetIndex - 1 : targetIndex,
            0,
            moved
          );

          const ordered = newPagesOrder.map((page, index) => ({
            ...page,
            order: index,
          }));

          setCurrentPages(ordered);

          ordered.forEach(async (page, idx) => {
            try {
              await upsertFunnelPage(
                subAccountId,
                {
                  id: page.id,
                  order: idx,
                  name: page.name,
                },
                funnelId
              );
            } catch (error) {
              toast.error("Failed", {
                description: "Could not save page order",
              });
            }
          });
        }
      },
    });
  }, [currentPages, funnelId, subAccountId]);

  const externalLink = `${process.env.NEXT_PUBLIC_SCHEME}${funnel.subDomainName}.${process.env.NEXT_PUBLIC_DOMAIN}/${clickedPage?.pathName}`;

  return (
    <AlertDialog>
      <div className="flex lg:flex-row flex-col">
        <aside className="lg:flex-[0.3] bg-background rounded-ss-md rounded-se-md lg:rounded-se-none lg:rounded-es-md p-6 flex flex-col justify-between">
          <ScrollArea className="h-full ">
            <div className="flex gap-2 text-lg font-semibold items-center mb-4">
              <CheckCircle2 />
              Funnel Steps
            </div>
            {currentPages.length ? (
              <div ref={containerRef}>
                {currentPages.map((page, index) => (
                  <React.Fragment key={page.id}>
                    <DropZone index={index} />
                    <div
                      className="relative"
                      onClick={() => setClickedPage(page)}
                    >
                      <FunnelStepCard
                        funnelPage={page}
                        index={index}
                        totalPages={currentPages.length - 1}
                        activePage={page.id === clickedPage?.id}
                      />
                    </div>
                  </React.Fragment>
                ))}
                <DropZone index={currentPages.length} />
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-6">
                No pages found.
              </div>
            )}
          </ScrollArea>
          <Button
            className="mt-4 w-full inline-flex gap-2 items-center"
            onClick={() => {
              setOpen(
                <Dialog>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create or Update a Funnel Page</DialogTitle>
                      <DialogDescription>
                        Funnel Pages allow you to create step by step processes
                        for customers to follow
                      </DialogDescription>
                    </DialogHeader>
                    <CreateFunnel
                      subAccountId={subAccountId}
                      funnelId={funnelId}
                      order={currentPages.length}
                    />
                  </DialogContent>
                </Dialog>
              );
            }}
          >
            <PlusCircle className="w-4 h-4" />
            Create New Steps
          </Button>
        </aside>
        <aside className="lg:flex-[0.7] bg-muted lg:rounded-se-md rounded-ee-md rounded-es-md lg:rounded-es-none p-4">
          {currentPages.length ? (
            <Card className="h-full flex justify-between flex-col">
              <CardHeader className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Page name</p>
                  <CardTitle>{clickedPage?.name}</CardTitle>
                </div>
                <CardDescription className="flex flex-col gap-4 mt-4">
                  <div className="border-2 rounded-lg sm:w-80 w-full overflow-clip">
                    <Link
                      href={`/subaccount/${subAccountId}/funnels/${funnelId}/editor/${clickedPage?.id}`}
                    >
                      <div className="cursor-pointer group-hover:opacity-30 w-full">
                        <FunnelPagePlaceholder />
                      </div>
                      <LucideEdit
                        className="w-12 h-12 text-muted-foreground absolute top-1/2 left-1/2 opacity-0 
                        transform -translate-x-1/2 -translate-y-1/2 group-hover:opacity-100 transition-all duration-100"
                      />
                    </Link>
                    <Link
                      href={externalLink}
                      target="_blank"
                      className="group flex items-center justify-center p-2 gap-2 hover:text-primary transition-colors duration-200"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <div className="w-64 overflow-hidden overflow-ellipsis">
                        {externalLink}
                      </div>
                    </Link>
                  </div>
                  <CreateFunnel
                    subAccountId={subAccountId}
                    defaultData={clickedPage}
                    funnelId={funnelId}
                    order={clickedPage?.order}
                  />
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="h-96 flex items-center justify-center text-muted-foreground">
              Create a page to view page settings.
            </div>
          )}
        </aside>
      </div>
    </AlertDialog>
  );
};

export default FunnelSteps;
