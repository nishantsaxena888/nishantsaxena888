import { ItemPerPageSelect } from "./item-per-page-select";

interface ItemsPerPageInfoProps {
  itemPerPage: number;
  total: number;
  listLength: number;
  onItemPerPageChange: (val: number) => void;
}

export const ItemsPerPageInfo = ({
  itemPerPage,
  total,
  listLength,
  onItemPerPageChange,
}: ItemsPerPageInfoProps) => {
  return (
    <div className="flex items-center gap-6">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          Per page:
        </span>
        <ItemPerPageSelect
          value={itemPerPage || 10}
          onValueChange={onItemPerPageChange}
        />
      </div>
      <div className="text-sm text-muted-foreground">
        Showing {listLength || 0} of {total || 0} results
      </div>
    </div>
  );
};
