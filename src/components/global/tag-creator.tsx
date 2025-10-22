import { Tag } from "@prisma/client";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { Alert } from "../ui/alert";
import { AlertDialog } from "@radix-ui/react-alert-dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "../ui/command";
import TagComponent from "./tag";
import { PlusCircleIcon, TrashIcon, X } from "lucide-react";
import { toast } from "../ui/use-toast";
import { v4 } from "uuid";
import { deleteTag, getTagsForSubaccount, saveActivityLogsNotification, upsertTag } from "@/lib/queries";
import { AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog";
import { set } from "date-fns";

type Props = {
  subAccountId: string;
  getSelectedTags: (tags: Tag[]) => void;
  defaultTags: Tag[];
};

const TagColor = ["BLUE", "ORANGE", "ROSE", "PURPLE", "GREEN"] as const;
export type TagColor = (typeof TagColor)[number];

const TagCreator = ({ subAccountId, getSelectedTags, defaultTags }: Props) => {
  const [selectedTags, setSelectedTags] = React.useState<Tag[]>(
    defaultTags || []
  );
  const [tags, setTags] = React.useState<Tag[]>([]);
  const router = useRouter();
  const [value, setValue] = React.useState<string>("");
  const [selectedColor, setSelectedColor] = React.useState<string>("");

  useEffect(() => {
    getSelectedTags(selectedTags);
  }, [selectedTags]);
 
  useEffect(()=>{
  if(subAccountId){
    const fetchData = async()=>{
      const response = await getTagsForSubaccount(subAccountId);
      if(response) setTags(response.Tags);
    }
      fetchData();
  }

  },[subAccountId])
  const handleDeleteSelection = (tagId: string) => {
    setSelectedTags(selectedTags.filter((tag) => tag.id! == tagId));
  };

  const handleAddTag = async () => {
    if (!value) {
      toast({
        variant: "destructive",
        title: "Tag need to have a name",
      });
      return;
    }
    if (!selectedColor) {
      toast({
        variant: "destructive",
        title: "please select a color",
      });
      return;
    }

    const tagData: Tag = {
      color: selectedColor,
      createdAt: new Date(),
      name: value,
      subAccountId: subAccountId,
      updatedAt: new Date(),
      id: v4(),
    };

    setTags([...tags, tagData]);
    setValue("");
    setSelectedColor("");

    try {
      const response = await upsertTag(subAccountId, tagData);
      toast({
        title: "Created the tag",
      });

      await saveActivityLogsNotification({
        agencyId: undefined,
        subaccountId: subAccountId,
        description: `Updated a tag | ${response?.name}`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to create the tag",
      });
    }
  };

  const handleAddSelection = (tag:Tag) => {
    if(selectedTags.every((t)=>t.id !== tag.id)){
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    setTags(tags.filter((tag) => tag.id! != tagId));
    try{
      const response = await deleteTag(tagId);
      toast({
        title: "Deleted the tag",
        description:"The tag is deleted from your subaccount"
      });

      await saveActivityLogsNotification({
        agencyId: undefined,
        subaccountId: subAccountId,
        description: `Deleted a tag | ${response?.name}`,
      });
      router.refresh();
    } catch(error){
      toast({
        variant: "destructive",
        title: "Failed to delete the tag",
      });
    }
  }
  return (
    <AlertDialog>
      <Command className="bg-transparent">
        {!!selectedTags.length && (
          <div className="flex flex-wrap gap-2 p-2 bg-background border-2 border-border rounded-md">
            {selectedTags.map((tag) => (
              <div className="flex items-center" key={tag.id}>
                <TagComponent title={tag.name} colorName={tag.color} />
                <X
                  size={14}
                  className="text-muted-foreground cursor-pointer"
                  onClick={() => handleDeleteSelection(tag.id)}
                />
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center gap- my-2">
          {TagColor.map((colorName) => (
            <TagComponent
              key={colorName}
              title=""
              colorName={colorName}
              selectedColor={setSelectedColor}
            />
          ))}
        </div>
        <div className="relative">
          <CommandInput
            placeholder="Search for tag..."
            value={value}
            onValueChange={setValue}
          />
          <PlusCircleIcon
            onClick={handleAddTag}
            size={20}
            className="absolute top-1/2 transform -translate-y-1/2 right-2 hover:text-primary transition-all cursor-pointer text-muted-foreground"
          />
        </div>

        <CommandList>
          <CommandSeparator />
          <CommandGroup heading="Tags">
            {tags.map((tag) => (
              <CommandItem
                key={tag.id}
                className="hover:!bg-secondary !bg-transparent flex items-center justify-between !font-light cursor-pointer"
              >
                <div onClick={() => handleAddSelection(tag)}>
                  <TagComponent title={tag.name} colorName={tag.color} />
                </div>
                <AlertDialogTrigger>
                  <TrashIcon size={16} className="cusrsor-pointer text-muted-foreground hover:text-rose-400 transition-all" />
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-left">Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription className="text-left">This action cannot be undone. This will permanently delete the tag and remove it from our servers.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction className="destructive" onClick={() => handleDeleteTag(tag.id)}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandEmpty>No tag found.</CommandEmpty>

        </CommandList>
      </Command>
    </AlertDialog>
  );
};


export default TagCreator;