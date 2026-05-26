import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { NotificationList } from "@/components/notifications/notification-list";

export default async function NotificationsPage() {
  const session = await getSession();
  if (!session) return null;

  const notifications = await prisma.notification.findMany({
    where: { userId: session.id },
    orderBy: { createdAt: "desc" },
  });

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
        <p className="text-slate-500 mt-1">
          Order updates, shipping alerts, and follow-up reminders · {unread} unread
        </p>
      </div>

      <Card>
        <CardHeader title="Notification Center" description="Email, SMS, and in-app alerts (MVP: in-app)" />
        <CardBody>
          {notifications.length === 0 ? (
            <p className="text-sm text-slate-500">No notifications yet.</p>
          ) : (
            <NotificationList
              initial={notifications.map((n) => ({
                ...n,
                createdAt: n.createdAt.toISOString(),
              }))}
            />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
