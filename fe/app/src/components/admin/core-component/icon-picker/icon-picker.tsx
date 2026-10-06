"use client";

import { IconPicker as UIIconPicker, type IconName } from "@/components/third-party-shadcn/icon-picker";

interface IconPickerProps {
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    className?: string;
    themeName?: string;
}

export function IconPicker(props: IconPickerProps) {
    return <UIIconPicker value={props.value as IconName} onValueChange={(prop) => props?.onChange?.(prop as IconName)} className={props.className + ` `} />;
}