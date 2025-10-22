"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { ArrowDown, LayoutGrid } from "lucide-react";
import { type FunnelPage } from "@prisma/client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface FunnelStepCardProps {
  funnelPage: FunnelPage;
  index: number;
  activePage: boolean;
  totalPages: number;
}

const FunnelStepCard: React.FC<FunnelStepCardProps> = ({
  activePage,
  funnelPage,
  index,
  totalPages,
}) => {
  const portal =
    typeof document !== "undefined"
      ? document.getElementById("blur-page")
      : null;
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const element = cardRef.current;
    if (!element) return;

    return draggable({
      element,
      getInitialData: () => ({
        type: "funnel-page",
        id: funnelPage.id,
        index,
      }),
      onDragStart: () => setIsDragging(true),
      onDrop: () => setIsDragging(false),
    });
  }, [funnelPage.id, index]);

  const component = (
    <Card
      ref={cardRef}
      className={cn("p-0 relative cursor-grab my-2 rounded-sm", {
        "border-primary": activePage,
      })}
    >
      <CardContent className="p-0 flex items-center gap-4 flex-row">
        <div className="h-14 w-14 bg-muted rounded-ss-sm rounded-es-sm flex items-center justify-center">
          <LayoutGrid />
          {funnelPage.order !== totalPages && (
            <ArrowDown className="w-5 h-5 absolute -bottom-2 text-primary" />
          )}
        </div>
        {funnelPage.name}
      </CardContent>
      {funnelPage.order === 0 && (
        <Badge className="absolute top-2 right-2" variant="secondary">
          Default
        </Badge>
      )}
    </Card>
  );

  if (!portal) return component;
  if (isDragging) return createPortal(component, portal);

  return component;
};

export default FunnelStepCard;
