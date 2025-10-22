"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Edit, MoreVertical, PlusCircleIcon, Trash } from "lucide-react";

import { useModal } from "@/providers/modal-provider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CustomModal from "@/components/global/custom-modal";
import LaneForm from "@/components/forms/lane-form";
import TicketForm from "@/components/forms/ticket-form";

import { cn } from "@/lib/utils";
import type { LaneDetail, TicketWithTags } from "@/lib/types";
import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { deleteLane, saveActivityLogsNotification } from "@/lib/queries";
import { toast } from "@/components/ui/use-toast";
import PipelineTicket from "./pipeline-ticket";

// Helper function to format price
const formatPrice = (amount: number) => {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

interface PipelaneLaneProps {
  setAllTickets: React.Dispatch<React.SetStateAction<TicketWithTags>>;
  allTickets: TicketWithTags;
  tickets: TicketWithTags;
  pipelineId: string;
  laneDetails: LaneDetail;
  subAccountId: string;
  index: number;
}

const PipelineLane: React.FC<PipelaneLaneProps> = ({
  setAllTickets,
  tickets,
  pipelineId,
  laneDetails,
  subAccountId,
  allTickets,
  index,
}) => {
  const router = useRouter();
  const { setOpen } = useModal();
  const laneRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);
  const ticketContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Color cycling for lane indicator
  const colorOptions = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-red-500",
    "bg-yellow-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-orange-500",
    "bg-teal-500",
    "bg-cyan-500",
  ];

  const [currentColorIndex, setCurrentColorIndex] = useState(0);
  const currentColor = colorOptions[currentColorIndex];

  const laneAmt = useMemo(() => {
    return tickets.reduce(
      (sum, ticket) => sum + (Number(ticket?.value) || 0),
      0
    );
  }, [tickets]);

  const addNewTicket = (ticket: TicketWithTags[0]) => {
    setAllTickets([...allTickets, ticket]);
  };

  // Set up draggable for the lane with specific drag handle
  useEffect(() => {
    const element = laneRef.current;
    const dragHandle = dragHandleRef.current;
    if (!element || !dragHandle) {
      console.warn("Lane drag setup failed - missing elements", {
        element,
        dragHandle,
      });
      return;
    }

    console.log(
      "Setting up draggable lane:",
      laneDetails.name,
      "at index",
      index
    );

    return draggable({
      element,
      dragHandle,
      getInitialData: () => {
        const data = {
          type: "lane",
          id: laneDetails.id,
          index,
          laneId: laneDetails.id,
        };
        console.log("Lane drag started with data:", data);
        return data;
      },
      onDragStart: () => {
        console.log("Lane drag start:", laneDetails.name);
        setIsDragging(true);
      },
      onDrop: () => {
        console.log("Lane drag end:", laneDetails.name);
        setIsDragging(false);
        // Cycle to next color when dropped
        setCurrentColorIndex((prev) => (prev + 1) % colorOptions.length);
      },
    });
  }, [laneDetails.id, index]);

  // Set up drop target for tickets
  useEffect(() => {
    const element = ticketContainerRef.current;
    if (!element) return;

    return dropTargetForElements({
      element,
      getData: () => ({ type: "ticket-container", laneId: laneDetails.id }),
      canDrop: ({ source }) => source.data.type === "ticket",
    });
  }, [laneDetails.id]);

  const handleCreateTicket = () => {
    setOpen(
      <CustomModal
        title="Create A Ticket"
        subheading="Tickets are a great way to keep track of tasks"
      >
        <TicketForm
          getNewTicket={addNewTicket}
          laneId={laneDetails.id}
          subaccountId={subAccountId}
        />
      </CustomModal>
    );
  };

  const handleEditLane = () => {
    setOpen(
      <CustomModal title="Edit Lane Details" subheading="">
        <LaneForm pipelineId={pipelineId} defaultData={laneDetails} />
      </CustomModal>
    );
  };

  const handleDeleteLane = async () => {
    try {
      const response = await deleteLane(laneDetails.id);

      await saveActivityLogsNotification({
        agencyId: undefined,
        description: `Deleted a lane | ${response?.name}`,
        subaccountId: subAccountId,
      });

      toast({
        title: "Deleted",
        description: "Deleted lane",
      });
      router.refresh();
    } catch (error) {
      console.error("Failed to delete lane:", error);
      toast({
        title: "Oppse!",
        description: "Could not delete the lane",
      });
    }
  };

  return (
    <div
      ref={laneRef}
      className={`h-full rounded-md ${
        isDragging ? "opacity-50 transform rotate-2" : ""
      }`}
      style={
        isDragging
          ? {
              transform: "rotate(5deg)",
              zIndex: 999,
            }
          : {}
      }
    >
      <AlertDialog>
        <DropdownMenu>
          <div className="bg-slate-200/30 dark:bg-background/20 h-[700px] w-[300px] px-4 relative rounded-md overflow-visible flex-shrink-0">
            <div
              ref={dragHandleRef}
              className="h-14 backdrop-blur-lg dark:bg-background/40 bg-slate-200/60 rounded-md absolute top-0 left-0 right-0 z-10 cursor-grab active:cursor-grabbing hover:bg-slate-300/60 dark:hover:bg-background/60 transition-colors"
              title="Drag to reorder lane"
            >
              <div className="h-full flex items-center p-4 pr-2 justify-between border-b-[1px]">
                <div className="flex items-center w-full gap-2">
                  <div
                    className={cn(
                      "w-4 h-4 rounded-full transition-all duration-300 ease-in-out",
                      currentColor
                    )}
                  />
                  <span className="font-bold text-sm">{laneDetails.name}</span>
                </div>
                <div className="flex items-center flex-row gap-1">
                  <Badge className="bg-white text-black">
                    {formatPrice(laneAmt)}
                  </Badge>
                  <DropdownMenuTrigger>
                    <MoreVertical className="text-muted-foreground cursor-pointer w-5 h-5" />
                  </DropdownMenuTrigger>
                </div>
              </div>
            </div>

            <div
              ref={ticketContainerRef}
              className="max-h-[700px] h-full w-full pt-12 overflow-auto scrollbar scrollbar-thumb-muted-foreground/20 scrollbar-thumb-rounded-full scrollbar-track-rounded-full scrollbar-medium z-[99999]"
            >
              {tickets.map((ticket, ticketIndex) => (
                <PipelineTicket allTickets={allTickets} setAllTickets={setAllTickets} subAccountId={subAccountId} ticket={ticket} key={ticket.id.toString()} index={ticketIndex} />
              ))}
            </div>

            <DropdownMenuContent>
              <DropdownMenuLabel>Options</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="flex items-center gap-2 w-full cursor-pointer"
                onClick={handleEditLane}
              >
                <Edit className="w-4 h-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex items-center gap-2 w-full cursor-pointer"
                onClick={handleCreateTicket}
              >
                <PlusCircleIcon className="w-4 h-4" />
                Create Ticket
              </DropdownMenuItem>
              <AlertDialogTrigger className="w-full">
                <DropdownMenuItem className="flex items-center gap-2 w-full cursor-pointer text-destructive">
                  <Trash className="w-4 h-4" />
                  Delete
                </DropdownMenuItem>
              </AlertDialogTrigger>
            </DropdownMenuContent>
          </div>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this
                lane and all its tickets from the pipeline.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex items-center">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive"
                onClick={handleDeleteLane}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </DropdownMenu>
      </AlertDialog>
    </div>
  );
};

export default PipelineLane;
