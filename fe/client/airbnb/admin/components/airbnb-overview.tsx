// airbnb admin landing — host/business snapshot: inventory health,
// booking pipeline and review standing from dynamic actions.
interface Listing {
  id: number;
  title: string;
  category?: string;
  price?: number;
  rating?: number;
  available?: boolean;
}
interface Booking {
  id: number;
  listing: string;
  guest: string;
  check_in?: string;
  check_out?: string;
  total?: number;
  status?: string;
}

const money = (n?: number) => `₹${(n ?? 0).toLocaleString()}`;

export default function AirbnbOverview({
  actionData,
  content,
}: {
  actionData?: any;
  content?: any;
}) {
  const listings: Listing[] = actionData?.data?.listings?.items ?? [];
  const bookings: Booking[] = actionData?.data?.bookings?.items ?? [];
  const hostCount: number =
    actionData?.data?.hosts?.total ?? actionData?.data?.hosts?.items?.length ?? 0;
  const reviews: any[] = actionData?.data?.reviews?.items ?? [];

  const live = listings.filter((l) => l.available).length;
  const revenue = bookings
    .filter((b) => b.status !== "cancelled")
    .reduce((s, b) => s + (b.total ?? 0), 0);
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + (r.rating ?? 0), 0) / reviews.length).toFixed(2)
    : "—";

  const stats = [
    { label: "Listings live", value: `${live}/${listings.length}` },
    { label: "Bookings", value: bookings.length },
    { label: "Hosts", value: hostCount },
    { label: "Booking revenue", value: money(revenue) },
    { label: "Avg rating", value: `★ ${avgRating}` },
  ];

  const upcoming = bookings.filter(
    (b) => b.status === "confirmed" || b.status === "pending",
  );

  return (
    <div className="airbnb-overview p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">
          {content?.title ?? "Marketplace Overview"}
        </h2>
        <p className="text-sm text-muted-foreground">
          Inventory, bookings and host health across the platform.
        </p>
      </div>

      <div className="grid grid-cols-5 gap-4 max-w-4xl">
        {stats.map((s) => (
          <div key={s.label} className="stat-card rounded-lg border bg-card p-4">
            <div className="text-xl font-bold">{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {upcoming.length > 0 && (
        <div className="max-w-2xl space-y-2">
          <h3 className="text-sm font-medium">Upcoming stays</h3>
          {upcoming.map((b) => (
            <div
              key={b.id}
              className="booking-row flex items-center justify-between rounded-lg border p-3"
            >
              <div>
                <div className="text-sm font-medium">{b.listing}</div>
                <div className="text-xs text-muted-foreground">
                  {b.guest} · {b.check_in} → {b.check_out}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">{money(b.total)}</div>
                <span className={`status-badge status-${b.status ?? "pending"}`}>
                  {b.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
