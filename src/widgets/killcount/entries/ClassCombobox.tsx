"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/shared/lib/tw-merge";
import {
  Button,
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui";
import { CLASS_NAMES } from "./killcountEntriesModel";

type Props = {
  value: string;
  onChange: (className: string) => void;
};

export default function ClassCombobox({ value, onChange }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (className: string) => {
    onChange(className === value ? "" : className);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          className={cn(
            "w-full justify-between font-normal",
            !value && "text-muted-foreground",
          )}
        >
          <span className="truncate">{value || "Не указан"}</span>
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder="Поиск класса…" />
          <CommandList>
            <CommandEmpty>Такого класса нет</CommandEmpty>
            {CLASS_NAMES.map((className) => (
              <CommandItem
                key={className}
                value={className}
                className="cursor-pointer"
                onSelect={() => handleSelect(className)}
              >
                <Check
                  className={cn(
                    value === className ? "opacity-100" : "opacity-0",
                  )}
                />
                {className}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
