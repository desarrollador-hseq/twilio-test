import { HTMLInputTypeAttribute, InputHTMLAttributes } from "react";
import { Control, FieldValues, UseControllerProps } from "react-hook-form";

import { cn } from "@/lib/utils";
import { PhoneInput } from "@/components/ui/phone-input";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";

interface PhoneInputFormProps<T extends FieldValues>
  extends UseControllerProps<T>,
    Omit<
      InputHTMLAttributes<HTMLInputElement>,
      "defaultValue" | "name" | "type" | "disabled"
    > {
  control: Control<T>;
  label: string;
  isSubmitting?: boolean;
  readOnly?: boolean;
  disabled?: boolean; 
  className?: string;
  tooltip?: string;
  type?: HTMLInputTypeAttribute | undefined;
  labelClassName?: string;
}

export function PhoneInputForm<T extends FieldValues>({
  control,
  name,
  label,
  isSubmitting,
  type,
  readOnly,
  tooltip,
  disabled,
  className,
  labelClassName,
  placeholder,
  rules,
  shouldUnregister,
  defaultValue,
}: PhoneInputFormProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      rules={rules}
      shouldUnregister={shouldUnregister}
      defaultValue={defaultValue}
      render={({ field }) => {
        // Obtener el valor del campo (código del país + número)
        const phoneValue = field.value || "";

        return (
          <FormItem className="w-full">
            <FormLabel
              className={cn(
                disabled && "text-slate-500",
                tooltip && "flex gap-2 items-center",
                labelClassName
              )}
              htmlFor={name}
            >
              {label} 
            </FormLabel>
            <FormControl>
              <PhoneInput
                defaultCountry="CO"
                value={phoneValue} // Pasar el valor completo (código del país + número)
                onChange={(value) => {
                  field.onChange(value ?? "");
                }}
                id={name}
                disabled={disabled}
                placeholder={placeholder}
                type={type || "text"}
                className={cn("bg-blue-50/80", className)}
                readOnly={readOnly}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  )
}
