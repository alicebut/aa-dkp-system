"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { fillScannerRecordValues } from "@/actions/fillScannerRecordValues";
import type { MissingStartFighter } from "@/server/killcountEntries/types";
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

type Props = {
  recordId: number;
  fighter: MissingStartFighter;
};

const VALUES_SCHEMA = v.pipe(
  v.object({
    playerClass: v.string(),
    startHonor: v.pipe(v.number(), v.minValue(1, "Введи честь")),
    endHonor: v.number(),
    startKills: v.number(),
    endKills: v.number(),
  }),
  v.forward(
    v.check(
      (values) => values.endHonor >= values.startHonor,
      "Меньше, чем на начало",
    ),
    ["endHonor"],
  ),
  v.forward(
    v.check(
      (values) => values.endKills >= values.startKills,
      "Меньше, чем на начало",
    ),
    ["endKills"],
  ),
);

type FormValues = v.InferInput<typeof VALUES_SCHEMA>;

export default function MissingStartRow({ recordId, fighter }: Props) {
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: valibotResolver(VALUES_SCHEMA),
    defaultValues: {
      playerClass: "",
      startHonor: 0,
      endHonor: 0,
      startKills: 0,
      endKills: 0,
    },
  });

  const handleSubmit = async (values: FormValues) => {
    try {
      await fillScannerRecordValues({
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
          <p className="text-xs text-muted-foreground">{fighter.reason}</p>
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
        <div className="w-28">
          <InputField
            name="startHonor"
            label="Честь: начало"
            inputVariant="integer"
            autoComplete="off"
          />
        </div>
        <div className="w-28">
          <InputField
            name="endHonor"
            label="Честь: конец"
            inputVariant="integer"
            autoComplete="off"
          />
        </div>
        <div className="w-28">
          <InputField
            name="startKills"
            label="Убийства: начало"
            inputVariant="integer"
            autoComplete="off"
          />
        </div>
        <div className="w-28">
          <InputField
            name="endKills"
            label="Убийства: конец"
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
