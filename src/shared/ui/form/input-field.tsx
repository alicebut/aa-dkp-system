"use client";
import {
  ChangeEvent,
  cloneElement,
  type ComponentProps,
  type FC,
  type HTMLAttributes,
  JSX,
} from "react";
import {
  FormControl,
  FormDescription,
  BaseFormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./base-form";
import { useFormContext } from "react-hook-form";
import { Input } from "../input";

export { Form } from "./base-form";

type InputVariant = "integer" | "text";

type InputFieldProps = {
  name: string;
  label?: string;
  description?: string;
  inputVariant?: InputVariant;
} & ComponentProps<"input">;

const getInputMode = ({
  inputMode,
  inputVariant,
}: InputFieldProps): HTMLAttributes<HTMLInputElement>["inputMode"] => {
  if (inputMode) {
    return inputMode;
  }

  switch (inputVariant) {
    case "integer": {
      return "numeric";
    }
    case "text": {
      return "text";
    }

    default: {
      return "text";
    }
  }
};

export const InputField: FC<InputFieldProps> = (props) => {
  const { name, description, label, inputVariant = "text", ...rest } = props;
  const { control } = useFormContext();

  const inputMode = getInputMode(props);

  return (
    <BaseFormField
      control={control}
      name={name}
      render={({ field }) => {
        const { value, onChange } = field;

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const inputValue = e.target.value;

          if (inputVariant === "text") {
            onChange(inputValue);
            return;
          }

          if (inputVariant === "integer") {
            const numberValue = Number(
              inputValue?.replace(/\s/g, "").match(/\d*/i)?.[0],
            );

            if (Number.isNaN(numberValue)) {
              return;
            }

            onChange(numberValue);
            return;
          }
        };

        return (
          <FormItem>
            {label && <FormLabel>{label}</FormLabel>}
            <FormControl>
              <Input
                {...rest}
                {...field}
                inputMode={inputMode}
                onChange={handleChange}
                value={value}
              />
            </FormControl>
            {description && <FormDescription>{description}</FormDescription>}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
};
