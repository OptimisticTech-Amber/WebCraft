import React from "react";

 const page = async ({
  params,
}: {
  params: { agencyId: String };
}) => {
  const agencyId = params.agencyId;
  return <div>{agencyId}</div>;
};

export default page;