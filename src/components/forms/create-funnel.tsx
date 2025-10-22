"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { v4 } from "uuid";
import { type Funnel, type FunnelPage } from "@prisma/client";

import { saveActivityLogsNotification } from "@/lib/queries";
import { upsertFunnel } from "@/lib/queries";

import { useModal } from "@/providers/modal-provider";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import FileUpload from "@/components/global/file-upload";
import { CreateFunnelFormSchema } from "@/lib/types";

type Props = {
  subAccountId: string;
  defaultData?: Funnel | FunnelPage | any;
  funnelId?: string;
  order?: number;
};

const CreateFunnel = ({ subAccountId, defaultData, funnelId }: Props) => {
  const router = useRouter();
  const { setClose } = useModal();

  const form = useForm<Zod.infer<typeof CreateFunnelFormSchema>>({
    mode: "onChange",
    resolver: zodResolver(CreateFunnelFormSchema),
    defaultValues: {
      name: defaultData?.name || "",
      description: defaultData?.description || "",
      favicon: defaultData?.favicon || "",
      subDomainName: defaultData?.subDomainName || "",
    },
  });

  React.useEffect(() => {
    if (defaultData) {
      form.reset({
        description: defaultData.description || "",
        favicon: defaultData.favicon || "",
        name: defaultData.name || "",
        subDomainName: defaultData.subDomainName || "",
      });
    }
  }, [defaultData]);

  const onSubmit = async (values: Zod.infer<typeof CreateFunnelFormSchema>) => {
    if (!subAccountId) return;

    const response = await upsertFunnel(
      subAccountId,
      { ...values, liveProducts: defaultData?.liveProducts || "[]" },
      // prefer explicit funnelId prop when provided, otherwise fall back to defaultData.id or generate
      funnelId || defaultData?.id || v4()
    );

    await saveActivityLogsNotification({
      agencyId: undefined,
      description: `Update funnel | ${response.name}`,
      subaccountId: subAccountId,
    });

    if (response) {
      toast.success("Success", {
        description: "Saved funnel details",
      });
    } else {
      toast.error("Oppse!", {
        description: "Could not save funnel details",
      });
    }

    setClose();
    router.refresh();
  };

  const isLoading = form.formState.isLoading || form.formState.isSubmitting;

  return (
    <Card className="flex-1 w-full">
      <CardHeader>
        <CardTitle>Funnel Details</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <FormField
              disabled={isLoading}
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Funnel Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Name" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              disabled={isLoading}
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Funnel Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us a little bit more about this funnel."
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              disabled={isLoading}
              control={form.control}
              name="subDomainName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sub domain</FormLabel>
                  <FormControl>
                    <Input placeholder="Sub domain for funnel" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              disabled={isLoading}
              control={form.control}
              name="favicon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Favicon</FormLabel>
                  <FormControl>
                    <FileUpload
                      apiEndpoint="subAccountLogo"
                      value={field.value as string}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button className="w-20 mt-4" disabled={isLoading} type="submit">
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default CreateFunnel;
