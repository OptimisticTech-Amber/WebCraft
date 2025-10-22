"use client";

import React, { use, useEffect } from "react";
import { z } from "zod";
import { useToast } from "../ui/use-toast";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { createMedia, saveActivityLogsNotification } from "@/lib/queries";
import { Input } from "../ui/input";
import FileUpload from "../global/file-upload";
import { Button } from "../ui/button";
import Loading from "../global/loading";

type Props = {
  subaccountId: string;
};

const formSchema = z.object({
  link: z.string().min(1, { message: "Media File is required" }),
  name: z.string().min(1, { message: "Name is required" }),
});


const UploadMediaForm = ({ subaccountId }: Props) => {
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onSubmit",
    defaultValues: {
      link: "",
      name: "",
    },
  });

  useEffect(() => {
    form.reset()
  }, []);
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const response = await createMedia(subaccountId, values);

      await saveActivityLogsNotification({
        agencyId: undefined,
        description: `Uploaded a media file |${response.name} `,
        subaccountId,
      });
      toast({
        title: "Success",
        description: "Media file uploaded successfully",
      });
      router.refresh();
    } catch (error) {
      console.log(error);
      toast({
        variant: "destructive",
        title: "Failed",
        description: "Failed to upload media file",
      });
    }
  };
  return (
    <Card className="w-full ">
      <CardHeader>
        <CardTitle>Media Information</CardTitle>
        <CardDescription>
          Please enter the details for your file
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>File Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="File Name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField control={form.control} name="link" render={({field})=>(
                <FormItem>
                     <FormLabel>Media File</FormLabel>
                     <FormControl>
                        <FileUpload 
                        apiEndpoint="subAccountLogo" value={field.value} onChange={field.onChange}/>
                     </FormControl>
                </FormItem>
            )}/>

            <Button type="submit" className="mt-4">{form.formState.isSubmitting?<Loading/>:'Upload Media'}</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default UploadMediaForm;
