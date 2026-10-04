// grocery admin landing — stat cards + recent orders, fed by dynamic
// actions declared in the overview entity's OPTIONS config.
interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  on_sale?: boolean;
}
interface Order {
  id: number;
  customer: string;
  total: number;
  status: string;
  created_at?: string;
}

export default function GroceryOverview({
  actionData,
  content,
}: {
  actionData?: any;
  content?: any;
}) {
  const products: Product[] = actionData?.data?.products?.items ?? [];
  const orders: Order[] = actionData?.data?.orders?.items ?? [];

  const revenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((s, o) => s + (o.total || 0), 0);
  const lowStock = products.filter((p) => (p.stock ?? 0) < 30).length;
  const pending = orders.filter((o) => o.status === "pending").length;

  const stats = [
    { label: "Products", value: actionData?.data?.products?.total ?? products.length },
    { label: "Orders", value: actionData?.data?.orders?.total ?? orders.length },
    { label: "Revenue", value: `$${revenue.toFixed(2)}` },
    { label: "Pending", value: pending },
    { label: "Low stock", value: lowStock },
  ];

  return (
    <div className="grocery-overview p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">
          {content?.title ?? "Store Overview"}
        </h2>
        <p className="text-sm text-muted-foreground">
          Live snapshot across the catalogue and order book.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="stat-card rounded-lg border bg-card p-4">
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {orders.length > 0 && (
        <div className="max-w-2xl">
          <h3 className="text-sm font-medium mb-2">Recent orders</h3>
          <table className="w-full text-sm border rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-muted text-left">
                <th className="p-2">#</th>
                <th className="p-2">Customer</th>
                <th className="p-2">Total</th>
                <th className="p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 6).map((o) => (
                <tr key={o.id} className="border-t">
                  <td className="p-2">{o.id}</td>
                  <td className="p-2">{o.customer}</td>
                  <td className="p-2">${(o.total ?? 0).toFixed(2)}</td>
                  <td className="p-2">
                    <span className={`order-status order-status-${o.status}`}>
                      {o.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
