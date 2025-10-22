import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { db } from "@/lib/db";
import { getLanesWithTicketAndTags, getPipelineDetails, updateLanesOrder, updateTicketsOrder } from "@/lib/queries";
import { LaneDetail } from "@/lib/types";
import { redirect } from "next/navigation";
import React from "react";
import PipelineInfoBar from "../_components/pipeline-infobar";
import PipelineSettings from "../_components/pipeline-settings";
import PipelineView from "../_components/pipeline-view";

type Props = {
  params: {
    subaccountId: string;
    pipelineId: string;
  };
};

const PipelinePage = async ({ params }: Props) => {
  const pipelineDetails = await getPipelineDetails(params.pipelineId);
  if (!pipelineDetails) {
    return redirect(`/subaccount/${params.subaccountId}/pipelines`);
  }

  const pipeline = await db.pipeline.findMany({
    where: {
      subAccountId: params.subaccountId,
    },
  });

  const lanes = (await getLanesWithTicketAndTags(
    params.pipelineId
  )) as LaneDetail[];
  return (
    <Tabs defaultValue="view" className="w-full">
      <TabsList className="border-b-2 h-16 w-full justify-between bg-transparent mb-4">
        <PipelineInfoBar
          subaccountId={params.subaccountId}
          pipelineId={params.pipelineId}
          pipelines={pipeline}
        />

        <div>
        <TabsTrigger value="view" className="!bg-transparent w-40">
           Pipeline View 
        </TabsTrigger>
        <TabsTrigger value="settings" className="!bg-transparent w-40">
         Settings
        </TabsTrigger>
        </div>
      </TabsList>
      <TabsContent value="view">
       <PipelineView pipelineId={params.pipelineId} subaccountId={params.subaccountId} lanes={lanes} pipelineDetails={pipelineDetails} updateLanesOrder={updateLanesOrder} updateTicketsOrder={updateTicketsOrder} />
      </TabsContent>
      <TabsContent value="settings">
       <PipelineSettings pipelineId={params.pipelineId} subaccountId={params.subaccountId} pipelines={pipeline} />
      </TabsContent>
    </Tabs>
  );
};

export default PipelinePage;
