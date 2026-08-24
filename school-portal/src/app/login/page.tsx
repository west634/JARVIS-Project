import { LoginForm } from "@/app/login/LoginForm";

const DEMO_ACCOUNTS = [
  { role: "Student", email: "student@example.com" },
  { role: "Teacher", email: "teacher@example.com" },
  { role: "Parent", email: "parent@example.com" },
  { role: "Admin", email: "admin@example.com" },
];

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">School Portal</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Sign in to continue
          </p>
        </div>

        <div className="rounded-2xl border border-black/8 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          <LoginForm />
        </div>

        <div className="mt-6 rounded-2xl border border-dashed border-black/10 p-4 text-xs text-zinc-500 dark:border-white/10 dark:text-zinc-400">
          <p className="mb-2 font-semibold text-zinc-600 dark:text-zinc-300">
            Demo / development accounts
          </p>
          <p className="mb-2">
            Password for every demo account is <code className="rounded bg-black/5 px-1 py-0.5 dark:bg-white/10">demo1234</code>
          </p>
          <ul className="space-y-1">
            {DEMO_ACCOUNTS.map((a) => (
              <li key={a.email} className="flex justify-between gap-4">
                <span>{a.role}</span>
                <span className="font-mono">{a.email}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
