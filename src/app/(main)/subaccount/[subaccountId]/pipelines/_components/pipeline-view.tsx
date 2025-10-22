"use client";

import LaneForm from "@/components/forms/lane-form";
import CustomModal from "@/components/global/custom-modal";
import {
  LaneDetail,
  PipelineDetailsWithLanesCardsTagsTickets,
  TicketWithTags,
} from "@/lib/types";
import { useModal } from "@/providers/modal-provider";
import { Lane, Ticket } from "@prisma/client";
import { Plus, Flag } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  draggable,
  dropTargetForElements,
  monitorForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { Button } from "@/components/ui/button";
import PipelineLane from "./pipeline-lane";

// Drop zone component for better drag targeting
const DropZone = ({ index }: { index: number }) => {
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [isOver, setIsOver] = useState(false);

  useEffect(() => {
    const element = dropZoneRef.current;
    if (!element) return;

    return dropTargetForElements({
      element,
      getData: () => ({ type: "lane-drop-zone", index }),
      canDrop: ({ source }) => source.data.type === "lane",
      onDragEnter: () => setIsOver(true),
      onDragLeave: () => setIsOver(false),
      onDrop: () => setIsOver(false),
    });
  }, [index]);

  return (
    <div
      ref={dropZoneRef}
      className={`w-2 h-[700px] transition-all duration-200 ${
        isOver
          ? "bg-blue-500/30 border-2 border-blue-500 border-dashed"
          : "bg-transparent"
      }`}
    />
  );
};

type Props = {
  subaccountId: string;
  pipelineId: string;
  lanes: LaneDetail[];
  pipelineDetails: PipelineDetailsWithLanesCardsTagsTickets;
  updateLanesOrder: (lanes: Lane[]) => Promise<void>;
  updateTicketsOrder: (tickets: Ticket[]) => Promise<void>;
};

const PipelineView = ({
  subaccountId,
  pipelineId,
  lanes,
  pipelineDetails,
  updateLanesOrder,
  updateTicketsOrder,
}: Props) => {
  const { setOpen } = useModal();
  const router = useRouter();

  const [allLanes, setAllLanes] = useState<LaneDetail[]>([]);
  const [pendingChanges, setPendingChanges] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleAddlane = () => {
    setOpen(
      <CustomModal
        title="Create A Lane"
        subheading="Lanes allow you to group tickets"
      >
        <LaneForm pipelineId={pipelineId} />
      </CustomModal>
    );
  };

  useEffect(() => {
    if (lanes) {
      setAllLanes(lanes);
    }
  }, [lanes]);

  const ticketsFromAllLanes = React.useMemo(() => {
    const allTickets: any[] = [];
    lanes.forEach((item) => {
      item.Tickets.forEach((ticket) => {
        allTickets.push(ticket);
      });
    });
    return allTickets;
  }, [lanes]);

  const [allTickets, setAllTickets] = useState(ticketsFromAllLanes);

  // Debounced save function to prevent excessive API calls
  const debouncedSaveOrder = useCallback(
    (lanes: LaneDetail[]) => {
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Set pending changes indicator
      setPendingChanges(true);

      // Set new timeout to save after 1 second of inactivity
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          const reorderedLanes = lanes.map((lane, index) => ({
            ...lane,
            order: index,
          }));

          console.log(
            "Saving lane order to database...",
            reorderedLanes.map((l) => ({ name: l.name, order: l.order }))
          );
          await updateLanesOrder(reorderedLanes);
          setPendingChanges(false);
          console.log("Lane order saved successfully!");
        } catch (error) {
          console.error("Failed to save lane order:", error);
          setPendingChanges(false);
        }
      }, 1000);
    },
    [updateLanesOrder]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    // Set up drop target for the container
    return dropTargetForElements({
      element,
      getData: () => ({ type: "lane-container" }),
      canDrop: ({ source }) => source.data.type === "lane",
    });
  }, []);

  useEffect(() => {
    // Monitor drag operations
    return monitorForElements({
      onDragStart: ({ source }) => {
        console.log("Pipeline monitor - drag start:", source.data);
      },
      onDrop({ source, location }) {
        console.log("Pipeline monitor - drop:", {
          source: source.data,
          location,
        });

        const destination = location.current.dropTargets[0];
        if (!destination) {
          console.log("No drop target found");
          return;
        }

        const sourceData = source.data;
        const destinationData = destination.data;

        console.log("Drop data:", { sourceData, destinationData });

        // Handle lane reordering
        if (
          sourceData.type === "lane" &&
          destinationData.type === "lane-container"
        ) {
          const sourceIndex = sourceData.index as number;
          const sourceLaneId = sourceData.id as string;

          // Find the actual source lane
          const sourceLane = allLanes.find((lane) => lane.id === sourceLaneId);
          if (!sourceLane) return;

          // Get mouse position to determine drop position
          const rect = destination.element.getBoundingClientRect();
          const dropTargets = location.current.dropTargets;

          // Find target position based on other lanes
          let targetIndex = allLanes.length;

          // Look for lane drop targets to determine insertion point
          for (const target of dropTargets) {
            if (target.data.type === "lane-drop-zone") {
              targetIndex = target.data.index as number;
              break;
            }
          }

          if (sourceIndex === targetIndex) return;

          // Reorder lanes locally
          const newLanes = Array.from(allLanes);
          newLanes.splice(sourceIndex, 1);
          newLanes.splice(
            targetIndex > sourceIndex ? targetIndex - 1 : targetIndex,
            0,
            sourceLane
          );

          setAllLanes(newLanes);
          console.log(
            "Lane reordered locally, will save to database after delay..."
          );

          // Save to database with debouncing
          debouncedSaveOrder(newLanes);
        }

        // Handle ticket reordering between lanes
        if (
          sourceData.type === "ticket" &&
          destinationData.type === "ticket-container"
        ) {
          const sourceLaneId = sourceData.laneId as string;
          const targetLaneId = destinationData.laneId as string;
          const ticketId = sourceData.id as string;

          // Move ticket logic here if needed
          console.log(
            "Moving ticket:",
            ticketId,
            "from",
            sourceLaneId,
            "to",
            targetLaneId
          );
        }
      },
    });
  }, [allLanes, debouncedSaveOrder]);

  if (!pipelineDetails) {
    return <div>Loading...</div>;
  }

  return (
    <div className="bg-white/60 dark:bg-background/60 rounded-xl p-4 use-automation-zoom-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl">{pipelineDetails.name}</h1>
          {pendingChanges && (
            <div className="flex items-center gap-1 text-amber-600 text-sm">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
              Saving changes...
            </div>
          )}
        </div>
        <Button className="flex items-center gap-4" onClick={handleAddlane}>
          <Plus size={15} />
          Create Lane
        </Button>
      </div>
      <div
        ref={containerRef}
        className="flex items-center gap-x-2 overflow-auto"
      >
        <div className="flex items-start gap-3 mt-4">
          {allLanes.map((lane, index) => (
            <React.Fragment key={lane.id}>
              <DropZone index={index} />
              <PipelineLane
                allTickets={allTickets}
                setAllTickets={setAllTickets}
                subAccountId={subaccountId}
                pipelineId={pipelineId}
                laneDetails={lane}
                index={index}
                tickets={lane.Tickets}
              />
            </React.Fragment>
          ))}
          <DropZone index={allLanes.length} />
        </div>
        {!allLanes.length && (
          <div className="flex items-center justify-center w-full flex-col gap-2 text-muted-foreground pb-10">
            <Flag className="w-32 h-32 opacity-100" />
            <p className="text-xs font-medium">
              You don&apos;t have any lanes. Go create one!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PipelineView;
