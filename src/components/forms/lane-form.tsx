"use client";

import {
  getPipelineDetails,
  saveActivityLogsNotification,
  upsertLane,
} from "@/lib/queries";
import { LaneFormSchema } from "@/lib/types";
import { useModal } from "@/providers/modal-provider";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lane } from "@prisma/client";
import { useRouter } from "next/navigation";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "../ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import Loading from "../global/loading";

interface CreateLaneFormProps {
  defaultData?: Lane;
  pipelineId: string;
}

const LaneForm: React.FC<CreateLaneFormProps> = ({
  defaultData,
  pipelineId,
}) => {
  const { data, isOpen, setOpen, setClose } = useModal();
  const router = useRouter();
  const form = useForm<z.infer<typeof LaneFormSchema>>({
    mode: "onChange",
    resolver: zodResolver(LaneFormSchema),
    defaultValues: {
      name: defaultData?.name,
    },
  });

  useEffect(() => {
    if (defaultData) {
      form.reset({
        name: defaultData?.name,
      });
    }
  }, [defaultData]);

  const isLoading = form.formState.isLoading;

  const onSubmit = async (values: z.infer<typeof LaneFormSchema>) => {
    if (!pipelineId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Pipeline ID is required",
      });
      return;
    }

    try {
      const laneData: any = {
        ...values,
        pipelineId: pipelineId,
        order: defaultData?.order || 0,
      };
      
      // Only include id if we're updating an existing lane
      if (defaultData?.id) {
        laneData.id = defaultData.id;
      }
      
      const response = await upsertLane(laneData);

      const d = await getPipelineDetails(pipelineId);
      if (!d) {
        throw new Error("Could not fetch pipeline details");
      }

      await saveActivityLogsNotification({
        agencyId: undefined,
        description: `${defaultData?.id ? "Updated" : "Created"} a lane | ${
          response?.name
        }`,
        subaccountId: d.subAccountId,
      });

      toast({
        title: "Success",
        description: `Lane ${
          defaultData?.id ? "updated" : "created"
        } successfully`,
      });

      setClose();
      router.refresh();
    } catch (error) {
      console.error("Lane creation/update error:", error);
      toast({
        variant: "destructive",
        title: "Error!",
        description:
          error instanceof Error
            ? error.message
            : "Could not save lane details",
      });
    }
  };

  return (
    <Card className="w-full ">
      <CardHeader>
        <CardTitle>Lane Details</CardTitle>
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
                  <FormLabel>Lane Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button className="w-20 mt-4" disabled={isLoading} type="submit">
              {form.formState.isSubmitting ? <Loading /> : "Save"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default LaneForm;
