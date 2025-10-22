import React from "react";
import { TicketWithTags } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useModal } from "@/providers/modal-provider";
import { Contact, Tag, User } from "@prisma/client";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  getSubAccountTeamMembers,
  getAllSubAccountUsers,
  saveActivityLogsNotification,
  searchContacts,
  upsertTicket,
} from "@/lib/queries";

import { TicketFormSchema } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "../ui/command";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
// import TagDetails from "./TagDetails";

// import {
//   type TicketDetailsSchema,
//   TicketDetailsValidator,
// } from "@/lib/validators/ticket-details";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Check, ChevronsUpDownIcon, User2 } from "lucide-react";
import TagCreator from "../global/tag-creator";

type Props = {
  laneId: string;
  subaccountId: string;
  getNewTicket: (ticket: TicketWithTags[0]) => void;
};

const TicketForm = ({ getNewTicket, laneId, subaccountId }: Props) => {
  const router = useRouter();
  const { data: defaultData, setClose } = useModal();

  const [tags, setTags] = React.useState<Tag[]>([]);
  const [contactList, setContactList] = React.useState<Contact[]>([]);
  const [allTeamMembers, setAllTeamMembers] = React.useState<User[]>([]);
  const [contactId, setContactId] = React.useState<string>("");
  const [search, setSearch] = React.useState<string>("");
  const [assignedTo, setAssignedTo] = React.useState<string>(
    defaultData?.ticket?.Assigned?.id || "unassigned"
  );

  const saveTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const form = useForm<z.infer<typeof TicketFormSchema>>({
    resolver: zodResolver(TicketFormSchema),
    mode: "onChange",
    defaultValues: {
      name: defaultData.ticket?.name || "",
      description: defaultData.ticket?.description || "",
      value: String(defaultData.ticket?.value || 0),
    },
  });

  React.useEffect(() => {
    if (subaccountId) {
      const fetchTeamMembers = async () => {
        console.log("Fetching team members for subaccountId:", subaccountId);

        // Try the original restrictive query first
        let response = await getSubAccountTeamMembers(subaccountId);
        console.log("Restrictive query response:", response);

        // If no results, try the more flexible query
        if (!response || response.length === 0) {
          console.log(
            "No results from restrictive query, trying flexible query..."
          );
          response = await getAllSubAccountUsers(subaccountId);
          console.log("Flexible query response:", response);
        }

        if (response && response.length > 0) {
          setAllTeamMembers(response);
          console.log("Set team members:", response.length, "members");
        } else {
          console.log("No team members found with either query");
          console.log("Possible issues:");
          console.log("1. SubaccountId might be incorrect:", subaccountId);
          console.log("2. No users are associated with this subaccount");
          console.log("3. Database permissions might need setup");
        }
      };

      fetchTeamMembers();
    } else {
      console.log("No subaccountId provided");
    }
  }, [subaccountId]);

  React.useEffect(() => {
    if (defaultData.ticket) {
      form.reset({
        name: defaultData.ticket.name || "",
        description: defaultData.ticket.description || "",
        value: String(defaultData.ticket.value || 0),
      });

      // Update assigned team member when defaultData changes
      if (defaultData.ticket.Assigned?.id) {
        setAssignedTo(defaultData.ticket.Assigned.id);
      } else {
        setAssignedTo("unassigned");
      }

      if (defaultData.ticket.customerId) {
        setContactId(defaultData.ticket.customerId);
      }

      const fetchContacts = async () => {
        const response = await searchContacts(
          defaultData.ticket?.Customer?.name || ""
        );
        setContactList(response);
      };

      fetchContacts();
    }
  }, [defaultData]);

  const onSubmit: SubmitHandler<z.infer<typeof TicketFormSchema>> = async (
    values
  ) => {
    if (!laneId) return;

    try {
      const response = await upsertTicket(
        {
          ...values,
          laneId,
          id: defaultData.ticket?.id,
          assignedUserId: assignedTo === "unassigned" ? null : assignedTo,
          ...(contactId
            ? {
                customerId: contactId,
              }
            : {}),
        },
        tags
      );

      await saveActivityLogsNotification({
        agencyId: undefined,
        description: `Updated a ticket | ${response?.name}`,
        subaccountId: subaccountId,
      });

      toast.success("Success", {
        description: "Saved ticket details",
      });

      if (response) {
        getNewTicket(response);
        setClose();
      }

      router.refresh();
    } catch (error) {
      toast.error("Oppse!", {
        description: "Could not save ticket details",
      });
    }
  };

  const isLoading = form.formState.isLoading || form.formState.isSubmitting;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ticket Details</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              disabled={isLoading}
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ticket name</FormLabel>
                  <FormControl>
                    <Input placeholder="Ticket name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              disabled={isLoading}
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ticket description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Ticket description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              disabled={isLoading}
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ticket value</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-1 relative">
                      <div className="absolute top-0 left-0 w-8 h-10 grid place-items-center">
                        <span className="text-sm text-zinc-400">$</span>
                      </div>
                      <Input
                        placeholder="Ticket value"
                        className="pl-6"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <h3 className="text-2xl font-semibold">Add tags</h3>
            <TagCreator
              subAccountId={subaccountId}
              getSelectedTags={setTags}
              defaultTags={defaultData.ticket?.Tags || []}
            />
            <FormItem>
              <FormLabel>
                Assigned to Team Member
                <span className="text-xs text-muted-foreground ml-2">
                  ({allTeamMembers.length} members available)
                </span>
              </FormLabel>
              <Select onValueChange={setAssignedTo} value={assignedTo}>
                <SelectTrigger>
                  <SelectValue>
                    {assignedTo && assignedTo !== "unassigned" ? (
                      (() => {
                        const assignedMember = allTeamMembers.find(
                          (member) => member.id === assignedTo
                        );
                        return assignedMember ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="w-6 h-6">
                              <AvatarImage
                                alt="contact"
                                src={assignedMember.avatarUrl || ""}
                              />
                              <AvatarFallback className="bg-primary text-sm text-white">
                                {assignedMember.name
                                  ?.slice(0, 2)
                                  .toUpperCase() || (
                                  <User2 className="w-4 h-4" />
                                )}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">
                              {assignedMember.name}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Avatar className="w-6 h-6">
                              <AvatarFallback className="bg-primary text-sm text-white">
                                <User2 className="w-4 h-4" />
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-muted-foreground">
                              Not Assigned
                            </span>
                          </div>
                        );
                      })()
                    ) : (
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="bg-primary text-sm text-white">
                            <User2 className="w-4 h-4" />
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-muted-foreground">
                          Not Assigned
                        </span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned" className="cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="bg-muted text-sm">
                          <User2 className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground">
                        Unassign
                      </span>
                    </div>
                  </SelectItem>
                  {allTeamMembers.length > 0 ? (
                    allTeamMembers.map((teamMember) => (
                      <SelectItem
                        key={teamMember.id}
                        value={teamMember.id}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className="w-6 h-6">
                            <AvatarImage
                              alt="contact"
                              src={teamMember?.avatarUrl || ""}
                            />
                            <AvatarFallback className="bg-primary text-sm text-white">
                              {teamMember.name?.slice(0, 2).toUpperCase() || (
                                <User2 className="w-4 h-4" />
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{teamMember.name}</span>
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-members" disabled>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          No team members found
                        </span>
                      </div>
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </FormItem>
            <FormItem>
              <FormLabel>Customer</FormLabel>
              <Popover>
                <PopoverTrigger asChild className="w-full">
                  <Button
                    variant="outline"
                    role="combobox"
                    className="justify-between"
                  >
                    {contactId
                      ? contactList.find((c) => c.id === contactId)?.name
                      : "Select Customer..."}
                    <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                  <Command>
                    <CommandInput
                      placeholder="Search for customers..."
                      className="h-9"
                      value={search}
                      onValueChange={async (value) => {
                        setSearch(value);

                        if (saveTimerRef.current) {
                          clearTimeout(saveTimerRef.current);
                        }

                        saveTimerRef.current = setTimeout(async () => {
                          const response = await searchContacts(value);

                          setContactList(response);
                          setSearch("");
                        }, 1000);
                      }}
                    />
                    {!!contactList.length && (
                      <CommandEmpty>No Customer found.</CommandEmpty>
                    )}
                    {!contactList.length && (
                      <div className="py-6 text-center text-sm">
                        No Customer found.
                      </div>
                    )}
                    <CommandGroup>
                      {contactList.map((contact) => (
                        <CommandItem
                          key={contact.id}
                          value={contact.id}
                          onSelect={(currentValue) => {
                            setContactId(
                              currentValue === contactId ? "" : currentValue
                            );
                          }}
                        >
                          {contact.name}
                          <Check
                            className={cn(
                              "ml-auto h-4 w-4",
                              contactId === contact.id
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </FormItem>
            <div className="flex justify-end">
              <Button className="w-20 mt-4" disabled={isLoading} type="submit">
                {isLoading ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default TicketForm;
