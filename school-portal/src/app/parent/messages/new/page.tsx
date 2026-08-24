import { requireRole } from "@/lib/auth/guards";
import { getContactableUsers } from "@/lib/services/contacts";
import { Card } from "@/components/ui/Card";
import { ComposeForm } from "@/components/messaging/ComposeForm";

export default async function NewParentMessagePage() {
  const session = await requireRole("PARENT");
  const contacts = await getContactableUsers(session.schoolId, session);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">New message</h1>
      <Card className="max-w-xl">
        <ComposeForm contacts={contacts} />
      </Card>
    </div>
  );
}
