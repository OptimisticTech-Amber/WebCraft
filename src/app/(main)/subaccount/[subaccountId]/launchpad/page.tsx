import BlurPage from "@/components/global/blur-page";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { db } from "@/lib/db";
import { sub } from "date-fns";
import { CheckCircleIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { Button } from "@/components/ui/button";

type Props = {
  searchparam: {
    state: string;
    code: string;
  };
  params: {
    subaccountId: string;
  };
};

const LaunchPad = async ({ params, searchparam }: Props) => {
  const subaccountDetails = await db.subAccount.findUnique({
    where: {
      id: params.subaccountId,
    },
  });
  if (!subaccountDetails) return;

  const alldetailsExist =
    subaccountDetails.address &&
    subaccountDetails.subAccountLogo &&
    subaccountDetails.companyEmail &&
    subaccountDetails.companyPhone &&
    subaccountDetails.city &&
    subaccountDetails.country &&
    subaccountDetails.name &&
    subaccountDetails.state;
  return (
    <BlurPage>
      <div className="flex flex-col justify-center items-center">
        <div className="w-full h-full max-w-[800px]">
          <Card>
            <CardHeader>
              <CardTitle>Lets get stared!</CardTitle>
              <CardDescription>
                Follow the steps below to get your account setup correctly.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex justify-between items-center w-full h-20 border p-4 rounded-lg">
                <div className="flex items-center gap-4">
                  <Image
                    src="/appstore.png"
                    alt="app logo"
                    width={80}
                    height={80}
                    className="rounded-md object-contain"
                  />
                  <p>Save the website as a shortcut on your mobile device</p>
                </div>
                <Button>Start</Button>
              </div>

              <div className="flex justify-between items-center w-full h-20 border p-4 rounded-lg">
                <div className="flex items-center gap-4">
                  <Image
                    src="/appstore.png"
                    alt="payments"
                    width={80}
                    height={80}
                    className="rounded-md object-contain"
                  />
                  <p>
                    Connect your stripe account to accept payments and see your
                    dashboard
                  </p>
                </div>
                <Button>Start</Button>
              </div>

              <div className="flex justify-between items-center w-full h-20 border p-4 rounded-lg">
                <div className="flex items-center gap-4 ">
                  <Image
                    src={subaccountDetails.subAccountLogo}
                    alt="app logo"
                    width={80}
                    height={80}
                    className="rounded-md object-contain"
                  />
                  <p>Fill in all your bussiness datials</p>
                </div>
                {alldetailsExist ? (
                  <CheckCircleIcon
                    size={50}
                    className="text-primary p-2 flex-shrink-0"
                  />
                ) : (
                  <Link
                    href={`/subaccount/${params.subaccountId}/settings`}
                    className="bg-primary py-2 px-4 rounded-md text-white"
                  >
                    Start
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </BlurPage>
  );
};

export default LaunchPad;
