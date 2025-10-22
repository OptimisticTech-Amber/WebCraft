"use client";

import { z } from "zod";
import { useToast } from "../ui/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { saveActivityLogsNotification, sendInvitation } from "@/lib/queries";
import { useRouter } from "next/navigation";
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
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Button } from "../ui/button";
import Loading from "../global/loading";

interface SendInvitationProps {
  agencyId: string;
}

const SendInvitation: React.FC<SendInvitationProps> = ({ agencyId }) => {
  const router = useRouter()
  const { toast } = useToast();
  const userDataSchema = z.object({
    email: z.string().email(),
    role: z.enum(["AGENCY_ADMIN", "SUBACCOUNT_USER", "SUBACCOUNT_GUEST"]),
  });

  const form = useForm<z.infer<typeof userDataSchema>>({
    resolver: zodResolver(userDataSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      role: "SUBACCOUNT_USER",
    },
  });
  const onSubmit = async (values: z.infer<typeof userDataSchema>) => {
    try {
      const res = await sendInvitation(values.role, values.email, agencyId);
      await saveActivityLogsNotification({
        agencyId: agencyId,
        description: `Invited ${values.email} `,
        subaccountId: undefined,
      });
      toast({
        title: "Success",
        description: "Created and sent invitation",
      });
      router.refresh();
    } catch (error) {
      console.log(error);
      toast({
        variant: "destructive",
        title: "Oppse!",
        description: "Could not send invitation",
      });
    }
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle>Invitation</CardTitle>

        <CardDescription>
          An Invitation will be sent to the user. Users who already have
          invitation sent out to their email, will not receive another
          invitation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <FormField
              disabled={form.formState.isSubmitting}
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className=" flex-1">
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter email" type="email" />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              disabled={form.formState.isSubmitting}
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem className=" flex-1">
                  <FormLabel>User Role</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value)}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select user role..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="AGENCY_ADMIN">Agency Admin</SelectItem>
                      <SelectItem value="SUBACCOUNT_USER">
                        Sub Account User
                      </SelectItem>
                      <SelectItem value="SUBACCOUNT_GUEST">
                        Sub Account Guest
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? <Loading /> : "Send Invitation"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default SendInvitation;
