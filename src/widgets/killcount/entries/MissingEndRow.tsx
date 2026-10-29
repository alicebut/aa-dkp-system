"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { fillScannerRecordEnd } from "@/actions/fillScannerRecordEnd";
import type { MissingEndFighter } from "@/server/killcountEntries/types";
import { v } from "@/shared/lib";
import { errorMessage } from "@/shared/lib/errorMessage";
import {
  BaseFormField,
  Button,
  Form,
  FormControl,
  FormItem,
  FormLabel,
  InputField,
} from "@/shared/ui";
import ClassCombobox from "./ClassCombobox";
import { startValuesText } from "./killcountEntriesModel";

type Props = {
  recordId: number;
  fighter: MissingEndFighter;
};

export default function MissingEndRow({ recordId, fighter }: Props) {
  const router = useRouter();
  const schema = v.object({
    playerClass: v.string(),
    endHonor: v.pipe(
      v.number(),
      v.minValue(fighter.startHonor, "Меньше, чем на начало"),
    ),
    endKills: v.pipe(
      v.number(),
      v.minValue(fighter.startKills, "Меньше, чем на начало"),
    ),
  });
  const form = useForm<v.InferInput<typeof schema>>({
    resolver: valibotResolver(schema),
    defaultValues: {
      playerClass: "",
      endHonor: fighter.startHonor,
      endKills: fighter.startKills,
    },
  });

  const handleSubmit = async (values: v.InferInput<typeof schema>) => {
    try {
      await fillScannerRecordEnd({
        recordId,
        userName: fighter.userName,
        ...values,
      });
      toast.success(`${fighter.userName} добавлен(а) в киллкаунт`);
      router.refresh();
    } catch (error) {
      toast.error(errorMessage(error, "Не получилось сохранить"));
    }
  };

  return (
    <Form {...form}>
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={form.handleSubmit(handleSubmit)}
      >
        <div className="w-full min-w-0 sm:w-48">
          <p className="truncate text-sm font-medium">{fighter.userName}</p>
          <p className="text-xs text-muted-foreground">
            {fighter.reason}; {startValuesText(fighter)}
          </p>
        </div>
        <div className="w-48">
          <BaseFormField
            control={form.control}
            name="playerClass"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Класс</FormLabel>
                <FormControl>
                  <ClassCombobox
                    value={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        <div className="w-32">
          <InputField
            name="endHonor"
            label="Честь на конец"
            inputVariant="integer"
            autoComplete="off"
          />
        </div>
        <div className="w-32">
          <InputField
            name="endKills"
            label="Убийства на конец"
            inputVariant="integer"
            autoComplete="off"
          />
        </div>
        <Button
          type="submit"
          variant="outline"
          className="cursor-pointer"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting && <Loader2 className="animate-spin" />}
          Добавить
        </Button>
      </form>
    </Form>
  );
}
