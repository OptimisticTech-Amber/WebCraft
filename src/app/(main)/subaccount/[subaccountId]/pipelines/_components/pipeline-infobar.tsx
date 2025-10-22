"use client";

import CreatePipelineForm from "@/components/forms/create-pipeline-form";
import CustomModal from "@/components/global/custom-modal";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useModal } from "@/providers/modal-provider";
import { Pipeline } from "@prisma/client";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import Link from "next/link";
import React from "react";

type Props = {
  subaccountId: string;
  pipelines: Pipeline[];
  pipelineId: string;
};

const PipelineInfoBar = ({ pipelineId, pipelines, subaccountId }: Props) => {
  const { setOpen: setOpenModal, setClose } = useModal();
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState(pipelineId);

  const handleClickCreatePipeline = () => {
    setOpenModal(
      <CustomModal
        title="Create A Pipeline"
        subheading="Pipelines allows you to group tickets into lanes and track your bussiness processes all in one place"
      >
        <CreatePipelineForm subAccountId={subaccountId} />
      </CustomModal>
    );
  };
  return (
    <div>
      <div className="flex items-end gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className="w-[200px] justify-between"
              role="combobox"
              aria-expanded={open}
            >
              {value
                ? pipelines.find((pipeline) => pipeline.id === value)?.name
                : "Select Pipeline"}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0">
            <Command>
              <CommandEmpty>No pipeline found.</CommandEmpty>
              <CommandGroup>
                {pipelines.map((pipeline) => (
                  <Link
                    key={pipeline.id}
                    href={`/subaccount/${subaccountId}/pipelines/${pipeline.id}`}
                  >
                    <CommandItem
                      key={pipeline.id}
                      onSelect={(currentValue) => {
                        setValue(currentValue === value ? "" : currentValue);
                        setOpen(false);
                      }}
                      value={pipeline.id}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === pipeline.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {pipeline.name}
                    </CommandItem>
                  </Link>
                ))}

                <Button
                  variant={"secondary"}
                  className="flex gap-2 w-full mt-4"
                  onClick={handleClickCreatePipeline}
                >
                  <Plus size={15} />
                  Create Pipeline
                </Button>
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default PipelineInfoBar;
