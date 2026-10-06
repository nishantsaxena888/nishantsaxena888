import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/third-party-shadcn/select";

interface ItemPerPageSelectProps {
  value: number;
  onValueChange: (value: number) => void;
}

export const ItemPerPageSelect = ({
  value,
  onValueChange,
}: ItemPerPageSelectProps) => {
  return (
    <Select
      value={String(value || 10)}
      onValueChange={(val) => onValueChange(Number(val))}
    >
      <SelectTrigger className="w-[80px] h-8 text-sm bg-background">
        <SelectValue placeholder="10" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="10">10</SelectItem>
        <SelectItem value="20">20</SelectItem>
        <SelectItem value="50">50</SelectItem>
        <SelectItem value="100">100</SelectItem>
      </SelectContent>
    </Select>
  );
};
