import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ProfileForm } from "@/components/profile/profile-form";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user) return null;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Profile Settings</h1>
        <p className="text-slate-500 mt-1">Manage your account and preferences</p>
      </div>

      <Card>
        <CardHeader title="User Profile" description={`Role: ${user.role}`} />
        <CardBody>
          <ProfileForm
            profile={{
              name: user.name,
              email: user.email,
              company: user.company,
              phone: user.phone,
              country: user.country,
              language: user.language,
            }}
          />
        </CardBody>
      </Card>
    </div>
  );
}
