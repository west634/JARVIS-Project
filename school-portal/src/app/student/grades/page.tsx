import Link from "next/link";
import { requireRole } from "@/lib/auth/guards";
import { getStudentGradesOverview } from "@/lib/services/studentGrades";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { WhatIfCalculator } from "./WhatIfCalculator";

export default async function StudentGradesPage() {
  const session = await requireRole("STUDENT");
  const classes = await getStudentGradesOverview(session.schoolId, session.userId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Grades</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Every grade explained, not just a number.</p>
      </div>

      {classes.length === 0 ? (
        <EmptyState message="No classes yet." />
      ) : (
        <div className="flex flex-col gap-6">
          {classes.map((c) => (
            <Card key={c.sectionId}>
              <div className="mb-4 flex items-center justify-between">
                <Link href={`/student/classes/${c.sectionId}?tab=grades`} className="text-lg font-semibold hover:underline">
                  {c.courseName}
                </Link>
                <span className="text-2xl font-semibold">
                  {c.currentGrade === null ? "—" : `${c.currentGrade.toFixed(1)}%`}
                </span>
              </div>

              {c.categoryGrades.length > 0 && (
                <table className="mb-4 w-full text-sm">
                  <thead>
                    <tr className="border-b border-black/8 text-left text-zinc-500 dark:border-white/10 dark:text-zinc-400">
                      <th className="pb-2 font-medium">Category</th>
                      <th className="pb-2 font-medium">Weight</th>
                      <th className="pb-2 text-right font-medium">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {c.categoryGrades.map((cat) => (
                      <tr key={cat.categoryId} className="border-b border-black/6 last:border-0 dark:border-white/8">
                        <td className="py-2">{cat.name}</td>
                        <td className="py-2 text-zinc-500 dark:text-zinc-400">{cat.weight}%</td>
                        <td className="py-2 text-right font-medium">
                          {cat.percentage === null ? "—" : `${cat.percentage.toFixed(1)}%`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <WhatIfCalculator categoryGrades={c.categoryGrades} />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
