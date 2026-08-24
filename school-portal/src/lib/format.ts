export function formatMinuteOfDay(minutes: number): string {
  const h24 = Math.floor(minutes / 60);
  const m = minutes % 60;
  const period = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

export function greeting(now: Date = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function formatDueDate(due: Date, now: Date = new Date()): string {
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDue = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const dayDiff = Math.round((startOfDue.getTime() - startOfToday.getTime()) / 86_400_000);
  const time = due.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

  if (dayDiff === 0) return `Today at ${time}`;
  if (dayDiff === 1) return `Tomorrow at ${time}`;
  if (dayDiff === -1) return `Yesterday at ${time}`;
  if (dayDiff > 1 && dayDiff < 7) {
    return `${due.toLocaleDateString(undefined, { weekday: "long" })} at ${time}`;
  }
  return `${due.toLocaleDateString(undefined, { month: "short", day: "numeric" })} at ${time}`;
}

export function firstName(fullName: string): string {
  return fullName.split(" ")[0] ?? fullName;
}
