"use client";
import { Agency, SubAccount } from "@prisma/client";
import { useForm } from "react-hook-form";
import React, { useEffect, useState } from "react";
import { NumberInput } from "@tremor/react";
import { v4 } from "uuid";

import { useRouter } from "next/navigation";
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
} from "../ui/alert-dialog";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { useToast } from "../ui/use-toast";

import * as z from "zod";
import FileUpload from "../global/file-upload";
import { Input } from "../ui/input";
import {
  saveActivityLogsNotification,
  upsertSubAccount
} from "@/lib/queries";
import { Button } from "../ui/button";
import Loading from "../global/loading";
import { useModal } from "@/providers/modal-provider";

const FormSchema = z.object({
  name: z.string().min(2, { message: "subAccount name must be atleast 2 chars." }),
  companyEmail: z.string().min(1),
  companyPhone: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  zipCode: z.string().min(1),
  state: z.string().min(1),
  country: z.string().min(1),
  subAccountLogo: z.string().min(1),
});

interface SubAccountDetailsProps {
    agencyDetails: Agency,
    details?:Partial<SubAccount>,
    userId:string,
    userName:string
}

const SubAccountDetails:React.FC<SubAccountDetailsProps> =({details,agencyDetails,userId,userName}) =>{
  const { toast } = useToast();
  const router = useRouter();
  const {setClose} = useModal();
  const form = useForm<z.infer<typeof FormSchema>>({
    mode: "onChange",
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: details?.name || "",
      companyEmail: details?.companyEmail || "",
      companyPhone: details?.companyPhone || "",
      address: details?.address || "",
      city: details?.city || "",
      zipCode: details?.zipCode || "",
      state: details?.state || "",
      country: details?.country || "",
      subAccountLogo: details?.subAccountLogo || "",
    },
  });

  const isLoading = form.formState.isSubmitting;

  useEffect(() => {
   if(details){
     form.reset(details)
   }
  }, [details]);

  const handleSubmit = async (values: z.infer<typeof FormSchema>) => {
    try {
        const response = await upsertSubAccount({
          id: details?.id ? details.id : v4(),
          address: values.address,
          subAccountLogo: values.subAccountLogo,
          city: values.city,
          companyPhone: values.companyPhone,
          country: values.country,
          name: values.name,
          state: values.state,
          zipCode: values.zipCode,
          createdAt: new Date(),
          updatedAt: new Date(),
          companyEmail: values.companyEmail,
          agencyId: agencyDetails.id,
          connectAccountId: "",
          goal: 5000,
        });
       
        if(!response) throw new Error('No response from server')
            await saveActivityLogsNotification({
        agencyId:response.agencyId,
    description:`${userName}| updated sub account | ${response.name}`, subaccountId:response.id}),
    toast({
        title: "Sub Account saved ",
        description: "Sub Account saved successfully",
      });
      setClose()
      router.refresh();
      } catch (error) {
      console.log(error);
      toast({
        variant: "destructive",
        title: "Oppse!",
        description: "could not sub account details",
      });
    }
  };
//   const handleDeleteSubAccount = async () => {
//     if (!details?.id) return;
//     setDeletingAgency(true);
//     //WIP: discontinue the subscription
//     try {
//       const response = await deleteSubAccount(data.id);
//       toast({
//         title: "Deleted Sub Account ",
//         description: "Deleted your subaccounts",
//       });
//       router.refresh();
//     } catch (error) {
//       console.log(error);
//       toast({
//         variant: "destructive",
//         title: "Oppse!",
//         description: "could not delete your agency ",
//       });
//     }
//     setDeletingAgency(false);
//   };

  return (
    <AlertDialog>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Sub Account Information</CardTitle>
          <CardDescription>
        Lets create SubAccount for your agency . You can edit subaccount settings
            later from the subaccount settings tab.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="subAccountLogo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sub Account Logo</FormLabel>
                    <FormControl>
                      <FileUpload
                        apiEndpoint="subAccountLogo"
                        onChange={field.onChange}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex md:flex-row gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Sub Account Name</FormLabel>
                      <FormControl>
                        <Input
                          disabled={isLoading}
                          placeholder="Your subaccount name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="companyEmail"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Sub Account Email</FormLabel>
                      <FormControl>
                        <Input placeholder="Email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex md:flex-row gap-4">
                <FormField
                  control={form.control}
                  name="companyPhone"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel> Phone Number</FormLabel>
                      <FormControl>
                        <Input
                          disabled={isLoading}
                          placeholder="Phone"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input
                        disabled={isLoading}
                        placeholder="123 st..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex md:flex-row gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input
                          disabled={isLoading}
                          placeholder="City"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input
                          disabled={isLoading}
                          placeholder="State"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="zipCode"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Zipcode</FormLabel>
                      <FormControl>
                        <Input
                          disabled={isLoading}
                          placeholder="Zipcode"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Input
                        disabled={isLoading}
                        placeholder="Country"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loading /> : "Save Sub Account Information"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </AlertDialog>
  );
};

export default SubAccountDetails;
