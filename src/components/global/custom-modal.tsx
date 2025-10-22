"use client";

import { useModal } from "@/providers/modal-provider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";

import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
type props = {
  title: string;
  subheading: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
};

const CustomModal = ({ title, subheading, children, defaultOpen }: props) => {
  const { isOpen, setOpen, setClose } = useModal();

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setClose();
    }
  };

  return (
    <Dialog open={isOpen || defaultOpen} onOpenChange={handleOpenChange}>
     <VisuallyHidden>
     <DialogTrigger>Open</DialogTrigger>
     </VisuallyHidden>
     
      <DialogContent className="overflow-scroll md:max-h-[700px] md:h-fit h-screen bg-card">
        <DialogHeader className="pt-8 text-left">
          <DialogTitle className="text-2xl font-bold">{title}</DialogTitle>
          <DialogDescription>{subheading}</DialogDescription>
          {children}
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};


export default CustomModal;