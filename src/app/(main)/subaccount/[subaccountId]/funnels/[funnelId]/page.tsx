import BlurPage from '@/components/global/blur-page';
import { buttonVariants } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getFunnel } from '@/lib/queries';
import { cn } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import React from 'react'
import FunnelSettings from './_components/funnel-settings';
import FunnelSteps from './_components/funnel-steps';

type Props = {
    params:{
        subaccountId: string;
        funnelId: string;
    }
}

const FunnelPage = async ({params}: Props) => {

    const funnelPages = await getFunnel(params.funnelId)
    if(!funnelPages) return redirect(`/subaccount/${params.subaccountId}/funnels`)
  return (
    <BlurPage>
      <Link
        href={`/subaccount/${params.subaccountId}/funnels`}
        className={cn(
          buttonVariants({ variant: "secondary" }),
          "mb-4 inline-flex items-center gap-2"
        )}
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>
      <Tabs defaultValue="steps" className="w-full">
        <TabsList className="bg-transparent border-b border-border rounded-none sm:flex-row flex-col gap-4 sm:gap-0 sm:h-16 h-auto w-full sm:justify-between mb-4 pb-4 sm:pb-0">
          <h1 className="text-3xl font-bold mb-4 text-secondary-foreground">{funnelPages.name}</h1>
          <div className="flex items-center w-full sm:w-auto">
            <TabsTrigger value="steps">Steps</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </div>
        </TabsList>
        <TabsContent value="steps">
          <FunnelSteps
            funnel={funnelPages}
            subAccountId={params.subaccountId}
            initialPages={funnelPages.FunnelPages}
            funnelId={params.funnelId}
          />
        </TabsContent>
        <TabsContent value="settings">
          <FunnelSettings
            subAccountId={params.subaccountId}
            defaultData={funnelPages}
          />
        </TabsContent>
      </Tabs>
    </BlurPage>
  )
}

export default FunnelPage

