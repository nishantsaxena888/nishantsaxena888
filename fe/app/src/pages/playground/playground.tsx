import { useState } from "react";
import { IteratorModule } from "../../components/admin/iterator/iterator-module";
import { FormPlayground } from "./form-playground";

const dummyData = [
  {
    id: 1,
    name: "Premium Widget",
    category: "Electronics",
    price: 299,
    inStock: true,
    rating: 4.8,
  },
  {
    id: 2,
    name: "Basic Gadget",
    category: "Electronics",
    price: 99,
    inStock: false,
    rating: 3.2,
  },
  {
    id: 3,
    name: "Organic Apples",
    category: "Groceries",
    price: 4,
    inStock: true,
    rating: 4.5,
  },
  {
    id: 4,
    name: "Whole Milk",
    category: "Groceries",
    price: 2.5,
    inStock: true,
    rating: 4.9,
  },
  {
    id: 5,
    name: "Running Shoes",
    category: "Apparel",
    price: 120,
    inStock: true,
    rating: 4.2,
  },
];

const dummyConfig = {
  table: [
    { key: "id", label: "ID" },
    { key: "name", label: "Name" },
    { key: "category", label: "Category" },
    { key: "price", label: "Price" },
    { key: "inStock", label: "In Stock" },
    { key: "rating", label: "Rating" },
  ],
  schema: [
    { name: "id", kind: "string", ui: { hidden: false } },
    { name: "name", kind: "string", ui: { hidden: false } },
    { name: "category", kind: "string", ui: { hidden: false } },
    { name: "price", kind: "number", ui: { hidden: false } },
    { name: "inStock", kind: "bool", ui: { hidden: false } },
    { name: "rating", kind: "number", ui: { hidden: false } },
  ],
};

export default function Playground() {
  const [selected, setSelected] = useState<any[]>([]);

  const handleAction = {
    onSelectedRowChange: (rows: any[]) => {
      setSelected(rows);
      console.log("Selected Rows:", rows);
    },
    onSort: (key: string, direction: string) => {
      console.log("Sorted by:", key, direction);
    },
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
        <div className="w-full max-w-5xl bg-white rounded-xl shadow-lg border p-6">
          <div className="mb-6 border-b pb-4">
            <h1 className="text-2xl font-bold text-gray-800">
              UI Engine Playground
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Testing the generic IteratorModule decoupled from specific app
              logic.
            </p>
          </div>

          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-green-600 mb-2">
              Selected Rows: {selected.length}
            </p>
          </div>

          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
            <IteratorModule
              data={dummyData}
              config={dummyConfig}
              type="table"
              action={handleAction}
              emptyText="No records found."
            />
          </div>
        </div>
      </div>
      <FormPlayground />
    </>
  );
}
