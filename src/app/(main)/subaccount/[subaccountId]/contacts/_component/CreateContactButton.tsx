
"use client";

import React from "react";
import { PlusCircle } from "lucide-react";
import { useModal } from "@/providers/modal-provider";
import CustomModal from "@/components/global/custom-modal";
import { Button } from "@/components/ui/button";
import ContactDetails from "@/components/forms/contact-user-from";



type Props = {
  subAccountId: string;
};

const CreateContactButton = ({ subAccountId }: Props) => {
  const { setOpen } = useModal();

  const handleCreateContact = async () => {
    setOpen(
      <CustomModal
        title="Create or update contact information"
        subheading="Contacts are like customers"
      >
        <ContactDetails subAccountId={subAccountId} />
      </CustomModal>
    );
  };

  return (
    <Button
      onClick={handleCreateContact}
      className="inline-flex items-center gap-2"
    >
      <PlusCircle className="w-4 h-4" />
      Create Contact
    </Button>
  );
};

export default CreateContactButton;
