import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Plus, PlusCircle } from "lucide-react";
import { columns } from "./columns";
import { getFunnels } from "@/lib/queries";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BlurPage from "@/components/global/blur-page";
import CreateFunnel from "@/components/forms/create-funnel";

import { buttonVariants } from "@/components/ui/button";
import { FunnelsForSubAccount } from "@/lib/types";
import FunnelsDataTable from "./data-table";

type Props = {
  params: {
    subaccountId: string;
  };
};

const Funnels = async ({ params }: Props) => {
//   const { subaccountId } = params;


  const funnels = await getFunnels(params.subaccountId);


  return (
    <BlurPage>
        
      <FunnelsDataTable
        actionButtonText={
          <>
            <PlusCircle className="w-4 h-4" />
            Create Funnel
          </>
        }
        modalChildren={<CreateFunnel subAccountId={params.subaccountId} />}
        filterValue="name"
        columns={columns}
        data={funnels} 
      />
    </BlurPage>
  );
};

export default Funnels;

// export const metadata = constructMetadata({
//   title: "Funnel - Plura",
// });
