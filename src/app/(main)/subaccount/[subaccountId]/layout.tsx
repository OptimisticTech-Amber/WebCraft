import Infobar from "@/components/global/infobar";
import Sidebar from "@/components/sidebar";
import Unauthorized from "@/components/unauthorized";
import {
  getAuthUserDetails,
  getNotificationAndUser,
  verifyAndAcceptInvitation,
} from "@/lib/queries";
import { currentUser } from "@clerk/nextjs/server";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import React from "react";
import { current } from "tailwindcss/colors";

type Props = {
  children: React.ReactNode;
  params: {
    subaccountId: string;
  };
};

const SubAccountLayout = async ({ children, params }: Props) => {
  const agencyId = await verifyAndAcceptInvitation();
  if (!agencyId) return <Unauthorized />;

  const user = await currentUser();
  if (!user) {
    return redirect("/");
  }

  let notifications: any = [];

  if (!user.privateMetadata.role) {
    return <Unauthorized />;
  } else {
    const allPermissions = await getAuthUserDetails();
    const hasPermission = allPermissions?.Permissions.find(
      (permission) =>
        permission.subAccountId === params.subaccountId && permission.access
    );
    if (!hasPermission) {
      return <Unauthorized />;
    }
    
    // Only call getNotificationAndUser if agencyId is valid
    let allNotification: any[] = [];
    if (agencyId) {
      allNotification = await getNotificationAndUser(agencyId) || [];
    }

    if (
      user.privateMetadata.role === "AGENCY_OWNER" ||
      user.privateMetadata.role === "AGENCY_ADMIN"
    ) {
      notifications = allNotification;
    } else {
      const filteredNoti = allNotification?.filter(
        (item) => item.subAccountId === params.subaccountId
      );
      if (filteredNoti) notifications = filteredNoti;
    }
  }
  return (
    <div className="h-screen overflow-hidden">
      <Sidebar id={params.subaccountId} type="subaccount" />
      <div className="md:pl-[300px]">
        <Infobar
          notifications={notifications}
          role={user.privateMetadata.role as Role}
          subAccountId={params.subaccountId as string}
        />
        <div className="relative">{children}</div>
      </div>
    </div>
  );
};

export default SubAccountLayout;
