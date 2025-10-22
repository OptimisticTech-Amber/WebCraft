"use client";

import { NotificationWithUser } from "@/lib/types";
import { UserButton } from "@clerk/nextjs";
import React, { useState } from "react";
import { twMerge } from "tailwind-merge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import { Bell } from "lucide-react";
import { Card } from "../ui/card";
import { Switch } from "../ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { ModeToggle } from "./mode-toggle";

type Props = {
  notifications: NotificationWithUser | [];
  role?: string;
  className?: string;
  subAccountId?: string;
};

const Infobar = ({ notifications, role, className, subAccountId }: Props) => {
  const [allnotification, setAllNotification] = useState(notifications);
  const [showAll, setShowAll] = useState(true);

  const handleClick = () => {
    if (!showAll) {
      setAllNotification(notifications);
    } else {
      if (notifications?.length !== 0) {
        setAllNotification(
          notifications?.filter(
            (items) => items.subAccountId === subAccountId
          ) ?? []
        );
      }
    }
    setShowAll((prev) => !prev);
  };
  return (
    <>
      <div
        className={twMerge(
          "fixed z-[20] left-0 right-0 top-0 bg-background/80 flex gap-4 items-center border-b-[1px] backdrop-blur-md p-1 ",
          className
        )}
      >
        <div className="flex gap-2 items-center ml-auto">
          <UserButton afterSignOutUrl="/" />

          <Sheet>
            <SheetTrigger>
              <div className="rounded-full w-9 h-9 bg-primary flex items-center justify-center text-white">
                <Bell size={17} />
              </div>
            </SheetTrigger>
            <SheetContent className="mt-4 mr-4 pr-4 overflow-scroll ">
              <SheetHeader className="text-left">
                <SheetTitle>Notifications</SheetTitle>
                <SheetDescription>
                  {(role === "AGENCY_OWNER" || role === "AGENCY_ADMIN") && (
                    <Card className="flex items-center justify-between p-4">
                      current Subaccount
                      <Switch onCheckedChange={handleClick} />
                    </Card>
                  )}
                </SheetDescription>
              </SheetHeader>
              {allnotification?.map((notification) => (
                <div
                  className="flex flex-col gap-y-2 mb-2 overflow-x-scroll text-ellipsis"
                  key={notification.id}
                >
                  <div className="flex gap-2">
                    <Avatar>
                      <AvatarImage
                        src={notification.User?.avatarUrl || ""}
                        alt="profile picture"
                      />
                      <AvatarFallback className="bg-primary">
                        {notification.User?.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <p>
                        <span className="font-bold">
                          {notification.notification.split("|")[0]}
                        </span>
                        <span className="text-muted-foreground">
                          {notification.notification.split("|")[1]}
                        </span>
                        <span className="font-bold">
                          {notification.notification.split("|")[2]}
                        </span>
                      </p>
                      <small>
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </small>
                    </div>
                  </div>
                </div>
              ))}
              {allnotification?.length === 0 && (
                <div className="flex justify-center items-center text-muted-foreground">
                  You have no notification
                </div>
              )}
            </SheetContent>
          </Sheet>
          <ModeToggle/>
        </div>
      </div>
    </>
  );
};

export default Infobar;
