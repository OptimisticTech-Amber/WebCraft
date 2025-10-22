
import AgencyDetails from "@/components/forms/Agency-details";
import UserDetails from "@/components/forms/user-details";
import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import React from "react";

type Props = {
  params: {
    agencyId: string;
  };
};

const SettingPage = async ({ params }: Props) => {
  const authUser = await currentUser();

  if (!authUser) return null;

  const userDetails = await db.user.findUnique({
    where: {
      email: authUser.emailAddresses[0].emailAddress,
    },
  });

  if (!userDetails) return null;

  const agencyDetails = await db.agency.findUnique({
    where:{
        id: params.agencyId
    },
    include:{
        SubAccount:true
    }
  })

  if(!agencyDetails) return null;

  const SubAccounts = agencyDetails.SubAccount;

  return <div className="flex md:flex-row flex-col gap-4">
    <AgencyDetails data={agencyDetails}/>
    <div>
    <UserDetails type="agency" userData={userDetails} id={params.agencyId} subAccounts={SubAccounts} />
    </div>
   
  </div>;
};

export default SettingPage;

