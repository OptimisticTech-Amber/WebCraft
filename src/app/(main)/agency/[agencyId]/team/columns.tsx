"use client";

import UserDetails from "@/components/forms/user-details";
import CustomModal from "@/components/global/custom-modal";
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
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { deleteUser, getUser } from "@/lib/queries";
import { UsersWithAgencySubAccountPermissionsSidebarOptions } from "@/lib/types";
import { useModal } from "@/providers/modal-provider";
import { Role } from "@prisma/client";
import { DropdownMenuLabel } from "@radix-ui/react-dropdown-menu";
import { ColumnDef } from "@tanstack/react-table";
import clsx from "clsx";
import { Copy, Edit, MoreHorizontal, Trash } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

export const columns: ColumnDef<UsersWithAgencySubAccountPermissionsSidebarOptions>[] =
  [
    {
      accessorKey: "id",
      header: "",
      cell: () => {
        return null;
      },
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => {
        const avatarUrl = row.getValue("avatarUrl") as string;
        return (
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 relative flex-none ">
              <Image
                src={avatarUrl}
                alt="avatar image"
                className="rounded-full object-cover"
                fill
              />
            </div>
            <span>{row.getValue("name")}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "avatarUrl",
      header: "",
      cell: () => {
        return null;
      },
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "SubAccount",
      header: "Owned Accounts",
      cell: ({ row }) => {
        const isAgencyOwner = row.getValue("role") === "AGENCY_OWNER";
        const ownedAccounts = row.original?.Permissions.filter(
          (per) => per.access
        );
        if (isAgencyOwner)
          return (
            <div className="flex flex-col items-start">
              <div className="flex flex-col gap-2">
                <Badge className="bg-slate-600 whitespace-nowrap">
                  Agency - {row.original?.Agency?.name}
                </Badge>
              </div>
            </div>
          );

        return (
          <div className="flex flex-col items-start">
            <div className="flex flex-col gap-2">
              {ownedAccounts?.length ? (
                ownedAccounts.map((account) => (
                  <Badge
                    key={account.id}
                    className="bg-slate-600 whitespace-nowrap"
                  >
                    Sub Account - {account.SubAccount.name}
                  </Badge>
                ))
              ) : (
                <div className="text-muted-foreground">No Access Yet</div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const role: Role = row.getValue("role");
        return (
          <Badge
            className={clsx({
              "bg-emerald-500": role === "AGENCY_OWNER",
              "bg-orange-400": role === "AGENCY_ADMIN",
              "bg-primary": role === "SUBACCOUNT_USER",
              "bg-muted": role === "SUBACCOUNT_GUEST",
            })}
          >
            {role}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const rowData = row.original;
        return <CellActions rowData={rowData} />;
      },
    },
  ];

interface CellActionsProps {
  rowData: UsersWithAgencySubAccountPermissionsSidebarOptions;
}

const CellActions: React.FC<CellActionsProps> = ({ rowData }) => {
  const { data, setOpen } = useModal();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  if (!rowData) return;
  if (!rowData.Agency) return;

  return (
    <AlertDialog>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem
            className="flex gap-2"
            onClick={() => navigator.clipboard.writeText(rowData?.email)}
          >
            <Copy size={15} /> Copy Email
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="flex gap-2"
            onClick={() => {
              setOpen(
                <CustomModal
                  title="Edit User Details"
                  subheading="You can change permissions only when the user has an owned subaccount "
                >
                  <UserDetails
                    type="agency"
                    id={rowData?.Agency?.id || null}
                    subAccounts={rowData?.Agency?.SubAccount}
                  />
                </CustomModal>,
                async () => {
                  return { user: await getUser(rowData?.id) };
                }
              );
            }}
          >
            <Edit size={15} /> Edit User Details
          </DropdownMenuItem>
          {rowData.role !== "AGENCY_OWNER" && (
            <AlertDialogTrigger >
              <DropdownMenuItem className="flex gap-2">
                <Trash size={15} /> Remove User
              </DropdownMenuItem>{" "}
            </AlertDialogTrigger>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-left">
            Are you absolutely sure?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left">
            This action cannot be undone. This will permanently delete the user
            and related data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="mb-2">Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive hover:bg-destructive-foreground"
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              await deleteUser(rowData?.id);
              toast({
                title: "User Deleted",
                description: "User has been deleted successfully",
              });
              setLoading(false);
              router.refresh();
            }}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
