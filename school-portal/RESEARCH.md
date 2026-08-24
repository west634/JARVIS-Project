# RESEARCH.md — K-12 School Management & LMS Landscape

Research conducted August 2026 to ground the design of this product in real, sourced complaints
and strengths of the incumbent platforms, rather than assumptions. Every claim below is attributed
to a source. Where a historical complaint has been addressed by a 2026 update, that is called out
explicitly rather than treated as still-valid.

---

## 1. Major Blackbaud Strengths

- **Single system of record.** All student information — learning records, health records, field
  trip forms, contact information — lives in one place, which schools value over juggling
  point solutions.
  [Blackbaud SIS reviews — Software Advice](https://www.softwareadvice.com/school-management/blackbaud-student-information-system-profile/)
- **Breadth and reliability.** Reviewers on TrustRadius rate the LMS as getting "the job done
  consistently with few glitches and downtime," and it integrates well with Google Drive; pages
  are fairly easy to customize.
  [Blackbaud LMS reviews — ITQlick](https://www.itqlick.com/blackbaud-learning-management-system)
- **Head-to-head, users rate it easier to set up/administer than Veracross**, and prefer doing
  business with Blackbaud overall, per G2 comparison data (4.2/5 vs Veracross 4.3/5, with
  Blackbaud favored on setup/administration, Veracross favored on support quality).
  [G2: Blackbaud SIS vs Veracross](https://www.g2.com/compare/blackbaud-student-information-system-vs-veracross)
- **2026 modernization is real, not vaporware.** Blackbaud shipped a redesigned "Quick Assignment"
  creation flow with sensible defaults (file submission, evaluation method, due date/time),
  reorganized every legacy setting into a more usable layout, added AI drafting tools for
  assignments, and modernized grading into a "cleaner, more intuitive SKY interface" that lets
  schools enter grades by class and manage grade categories/skills-based grading in one place.
  Letter grades can now be typed or picked from a dropdown, and assignment abbreviations are no
  longer required.
  [Blackbaud Product Update Briefings, May 2026](https://www.blackbaud.com/newsroom/article/pubs-may-2026) ·
  [Blackbaud 2026 K-12 User Conference recap](https://www.blackbaud.com/newsroom/article/all-the-biggest-announcements-from-blackbauds-2026-k-12-user-conference)

**Implication for us:** the "old Blackbaud is universally hated" narrative is outdated. We should
not assume every historical complaint (e.g., "assignment creation is clunky") is still true —
Blackbaud closed some of that gap in 2026. Our advantage has to come from architecture and
workflow decisions Blackbaud's incremental redesign didn't touch (see §11).

---

## 2. Major Blackbaud Weaknesses

- **Publishing model still requires two separate steps.** Grades must be enabled in "Publish
  Grade" settings *and* published in the Assignment Calendar before students can see them —
  teachers report this as "increased workload and a less effective pedagogical experience."
  [Blackbaud Community: Gradebook Publish Options](https://community.blackbaud.com/discussion/65582/recent-problems-with-gradebook-publish-options)
- **Gradebook sync bugs.** Students sometimes see a different cumulative grade than what's in the
  teacher's gradebook; support's suggested "fix" (re-entering a grade to force a resync) is viewed
  by teachers as not actually a fix.
  [Blackbaud Community: Students can't see my class grade](https://community.blackbaud.com/discussion/57359/students-cant-see-my-class-grade)
- **Silent calculation errors.** Teachers report assignments losing their "Add to cumulative
  grade" flag on their own, silently excluding real scores from the final grade — several insist
  they didn't uncheck the box themselves.
  [Blackbaud Community: Assignments dropped from cumulative grade](https://community.blackbaud.com/discussion/71119/assignments-being-dropped-from-cumulative-grade)
- **Excessive clicks / buried settings.** "Settings and reports … are harder to adjust if users
  don't know they're there"; drag-and-drop test/assessment creation is "not as intuitive as it
  appears."
  [Blackbaud LMS reviews — ITQlick](https://www.itqlick.com/blackbaud-learning-management-system)
- **Mobile assignment center barely functions.** The assignment center "does not work properly on
  mobile devices," making it hard to enter or complete assignments from a phone; students report
  accidentally turning in the wrong assignment and struggling just to open a task.
  [Blackbaud reviews summary — Software Advice](https://www.softwareadvice.com/student-engagement/blackbaud-learning-management-system-profile/)
- **UI inconsistency severe enough to drive users away.** A Blackbaud Community thread is literally
  titled *"User Interface Issues and Consistency --- Giving Up."*
  [Blackbaud Community](https://community.blackbaud.com/discussion/60938/user-interface-issues-and-consistency-giving-up)
- **Parent portal usability gaps persist even after the 2026 portal redesign.** The new course
  registration portal has a save bug (selections don't persist even when valid), an instructions
  box that covers the whole page when expanded, and course links with no visual affordance that
  they're clickable.
  [Blackbaud Community: New Parent Portal](https://community.blackbaud.com/discussion/66567/new-parent-portal-for-course-registration)
- **Billing/portal access is rigidly role-locked.** Only a user explicitly listed as "parent" can
  get billing access — a sibling or grandparent helping pay tuition is locked out by design.
  [Blackbaud SIS reviews — Software Advice](https://www.softwareadvice.com/school-management/blackbaud-student-information-system-profile/)
- **Auth reliability incidents.** Public status history shows real MFA/login outages in 2026 (Feb
  10, ~1h47m; Mar 2, ~3h07m sign-in failures), plus routine short outages reported by users.
  [StatusGator: Blackbaud status history](https://statusgator.com/services/blackbaud)
- **Documentation doesn't answer the actual question.** Searching help docs for features like
  "extra credit" returns results that don't explain how the feature behaves inside the gradebook.
  [Blackbaud Community: Grading calculation troubleshooting](https://community.blackbaud.com/discussion/84272/tips-for-troubleshooting-grading-calculations-in-blackbaud-learning-management-system)

---

## 3. Student Pain Points

- Mobile assignment center effectively broken; students describe "excessive" steps to find basic
  information and difficulty just opening a task.
  [Software Advice — Blackbaud LMS](https://www.softwareadvice.com/student-engagement/blackbaud-learning-management-system-profile/)
- Confusing status changes: an assignment can be edited/changed with no clear signal to the
  student that anything changed (motivates our **Recently Changed** feature, §6 of the product
  spec).
- Long text entries are hard to read/edit on mobile; risk of submitting the wrong file with no
  confirmation step.
  [Software Advice — Blackbaud LMS](https://www.softwareadvice.com/student-engagement/blackbaud-learning-management-system-profile/)
- Reactions to Blackbaud's own 2026 Assignment Center redesign were **mixed** among students at
  schools that rolled it out — some liked the cleanup, others found the new flow unfamiliar and
  harder to locate things they used to find quickly, showing that a redesign alone (without
  rethinking the underlying information architecture) doesn't guarantee a better experience.
  [The Evergreen Online — Blackbaud Assignment Center changes](https://evergreen.greenhill.org/blackbaud-makes-changes-to-assignment-center-and-receives-mixed-reactions/)

## 4. Teacher Pain Points

- Two-step publish requirement (settings + calendar) before students can see a posted grade — pure
  extra clicks with no pedagogical benefit.
  [Blackbaud Community](https://community.blackbaud.com/discussion/65582/recent-problems-with-gradebook-publish-options)
- Cannot add a student to an assignment after it's created — a routine mid-semester enrollment
  change becomes a workaround.
  [Blackbaud Community — Grading calculations](https://community.blackbaud.com/discussion/84272/tips-for-troubleshooting-grading-calculations-in-blackbaud-learning-management-system)
- Gradebook math that silently diverges from what's displayed, forcing teachers to police their
  own gradebook for accuracy rather than trust it.
  [Blackbaud Community](https://community.blackbaud.com/discussion/71119/assignments-being-dropped-from-cumulative-grade)
- Assessment/test creation via drag-and-drop is fiddly and less intuitive than it looks.
  [ITQlick](https://www.itqlick.com/blackbaud-learning-management-system)
- By contrast, teachers on Canvas specifically praise **SpeedGrader** for eliminating tab-switching
  and file-downloading — submissions, rubric, and annotation tools sit side by side, and 2025
  performance work made it materially faster on large classes. This is a concrete, teacher-loved
  workflow pattern worth adopting (side-by-side grading, no context switch).
  [Instructure: SpeedGrader](https://www.instructure.com/resources/blog/canvas-speedgrader-time-saving-lms-grading-tool)

## 5. Parent Pain Points

- **App/notification fatigue is the dominant, cross-platform parent complaint** — parents are
  juggling too many school apps/portals/passwords, and want one predictable channel (e.g. a single
  weekly digest) instead of scattered, unpredictable pings across multiple systems.
  [The Learning Standard — Parent App Fatigue](https://thelearningstandard.org/news/how-schools-are-tackling-parent-app-fatigue-and-tech-overload)
- On Infinite Campus's Campus Parent app: connection errors, a notification bubble that doesn't
  reliably update, and emails about missing/failing work arriving **weeks** after the teacher's
  update — which defeats the purpose of an early-warning notification.
  [Infinite Campus mobile app reviews summary](https://play.google.com/store/apps/details?id=com.infinitecampus.parent.campusportalhybrid&hl=en_US)
- Parents sometimes silently get suppressed from teacher emails (flagged "do not email") with no
  visible indicator in the portal that this happened.
  [Infinite Campus support discussion summary](https://www.infinitecampus.com/support/parents-and-families)
- Hidden menus, small fonts, and multi-step navigation make SIS portals hard for non-technical
  parents, especially on mobile.
  [Infinite Campus reviews summary](https://www.capterra.com/p/188836/Infinite-Campus/reviews/)
- On Blackbaud specifically, billing access is locked to whoever is tagged "parent," which
  actively blocks a paying grandparent/relative from portal access.
  [Software Advice — Blackbaud SIS](https://www.softwareadvice.com/school-management/blackbaud-student-information-system-profile/)
- In FACTS, there's no mechanism to flag or notify parents of missing work when a school uses
  standards-based grading — a structural gap, not a bug.
  [Infinite Campus/FACTS comparison summary](https://www.softwareadvice.com/school-management/facts-profile/vs/infinite-campus/)

## 6. Administrator Pain Points

- Report generation is not intuitive; users click through many steps before finding what they
  need, and building a genuinely custom report is complex and slow. Admins specifically want
  drag-and-drop reporting or ready-made templates.
  [FACTS Management — Common SIS problems](https://factsmgt.com/blog/6-common-problems-the-right-sis-can-solve/)
- Interfaces feel dated and require many clicks for basic tasks; lack of true bulk/mass actions.
  [FACTS SIS reviews — G2](https://www.g2.com/products/facts-sis-student-information-system/reviews)
- Communication tooling is fragmented across separate products (e.g., Finalsite splits CMS
  "Composer," mass-notification "Messages XR," and forms into different add-ons that have to be
  purchased and configured together), which is exactly the fragmentation that drives the parent
  app-fatigue complaint in §5.
  [Finalsite CMS/EMS communications guide](https://www.finalsitesupport.com/hc/en-us/articles/6363162603405-CMS-and-EMS-communications-A-guided-approach-for-schools-using-both-Finalsite-products)

## 7. Competitor Strengths

- **Google Classroom** — free, deeply integrated with Drive/Docs/Forms, extremely simple, ~150M
  users; the default for most US K-12 teachers because of that simplicity.
  [Weblogg-ed LMS comparison](https://weblogg-ed.com/2026/canvas-schoology-google-classroom-comparison/)
- **Canvas** — cleanest interface of the major three, most flexible assignment/rubric model,
  SpeedGrader is a genuine time-saver once learned; dominant in higher-ed (6,000+ institutions),
  proving the UX patterns scale.
  [Weblogg-ed LMS comparison](https://weblogg-ed.com/2026/canvas-schoology-google-classroom-comparison/) ·
  [Instructure SpeedGrader](https://www.instructure.com/resources/blog/canvas-speedgrader-time-saving-lms-grading-tool)
- **Schoology** — structured, advanced grading + discussion + deep third-party integrations; best
  regarded for keeping parents informed and pairs natively with PowerSchool SIS.
  [Weblogg-ed LMS comparison](https://weblogg-ed.com/2026/canvas-schoology-google-classroom-comparison/)
- **PowerSchool mobile** — real-time push notifications spanning grades, attendance, assignments,
  teacher comments, daily bulletins, schedule, and fees, all from one app — the *breadth* of a
  single mobile channel is the right idea, even if district-level implementation quality varies.
  [PowerSchool Parent/Student Portal support](https://help.powerschool.com/t5/Help-and-Technical-Support-for/PowerSchool-Parent-Student-Portal-amp-Mobile-App-Support/ta-p/542926)

## 8. Competitor Weaknesses

- **Google Classroom** is not really a full LMS: no real gradebook, no native usable rubric
  system, no parent portal beyond email summaries — schools end up needing a second system anyway.
  [Weblogg-ed LMS comparison](https://weblogg-ed.com/2026/canvas-schoology-google-classroom-comparison/)
- **Canvas** institutional pricing is quote-based with potential hidden costs, a real barrier for
  smaller independent K-12 schools.
  [Weblogg-ed LMS comparison](https://weblogg-ed.com/2026/canvas-schoology-google-classroom-comparison/)
- **Schoology**'s interface "has not aged as well as Canvas's," and its assignment workflow takes
  more clicks to do the same task as Canvas, with users reporting occasional bugs.
  [Weblogg-ed LMS comparison](https://weblogg-ed.com/2026/canvas-schoology-google-classroom-comparison/)
- **Veracross** clients report weak native LMS/gradebook functionality (schools bolt on a separate
  LMS anyway) and describe its "one record" model as easy to accidentally overwrite.
  [PeerSpot: Blackbaud SIS vs Veracross](https://www.peerspot.com/products/comparisons/blackbaud-sis_vs_veracross)
- **Infinite Campus** navigation is criticized for hidden menus and small fonts, and its
  notification pipeline can lag teacher updates by weeks — actively harmful for a "missing work"
  alert that only matters if it's fast.
  [Infinite Campus reviews](https://www.capterra.com/p/188836/Infinite-Campus/reviews/)
- **Finalsite** spreads website content, forms, and mass communications across multiple purchased
  modules rather than one unified inbox/notification model.
  [Finalsite product suite guide](https://www.finalsitesupport.com/hc/en-us/articles/43208025671309-Exploring-the-Finalsite-product-suite-A-guide-for-CMS-users)

## 9. Features We Should Adopt

- Canvas's **SpeedGrader pattern**: submission + rubric + annotation tools in one side-by-side
  view, no tab switching, no downloading files to grade them (§16 of product spec).
- Google Classroom's **radical simplicity** for the common case (post → submit → done) — but
  without giving up a real gradebook, rubric system, or parent view.
- PowerSchool's **single mobile channel covering everything** (grades, attendance, assignments,
  comments, bulletins, schedule) — one app, one login, one notification stream.
- Blackbaud 2026's **sane defaults on assignment creation** (pre-filled submission type/evaluation
  method/due time) so simple assignments take one screen, not a wizard.
- Schoology's **native parent-facing communication depth**, without Schoology's extra-click
  assignment workflow.

## 10. Features We Should Improve

- **Publishing model:** collapse Blackbaud's two-step "enable + publish" grade release into a
  single toggle with an explicit preview of what the student will see.
- **Change tracking:** none of the researched products surface a first-class "what changed since I
  last looked" feed — every one of them makes the student notice a due-date change by re-reading
  the assignment. This becomes our **Recently Changed** differentiator.
- **Notification timeliness:** Infinite Campus's own users report multi-week lag between a
  teacher's "missing" flag and the parent notification; ours must be near-real-time and testably so.
- **Reporting for admins:** replace multi-step report builders with named report templates plus a
  natural-language query bar, per FACTS Management's own stated customer ask for
  "drag-and-drop reporting or ready-made templates."
- **Mobile-first assignment submission**, since Blackbaud's is reported as barely usable on phones.
- **Access control that doesn't block real people:** allow multiple guardians/relatives billing or
  portal access without forcing everyone into a single "parent" role slot.

## 11. Features We Should Deliberately Avoid

- **Splitting one workflow across multiple purchased add-on modules** (Finalsite's CMS vs.
  Messages XR vs. Forms) — we ship one coherent messaging/notification system, not upsell tiers.
- **A "publish" step that's disconnected from "grade entry."** If a teacher enters a grade and
  intends to release it, that should be one action, not two settings in two different places.
- **Gamified priority/points systems** for assignments — the spec explicitly calls for a useful,
  non-distracting priority signal, and research turned up no evidence that gamification reduces
  the actual pain points (missed deadlines, notification fatigue); it risks adding noise on top of
  problems that are already about too much noise.
- **Locking guardian access to a single named "parent" role slot** (Blackbaud's billing
  restriction) — model household/guardian relationships explicitly instead.
- **A single all-purpose "record" with no workflow boundaries** — Veracross's one-record model is
  reported as easy to accidentally overwrite; we should keep clear write-boundaries per role even
  though the schema is unified.

## 12. Our Product's Unique Advantages

1. **One system, one notification stream, one login** — no Finalsite-style module split, no
   PowerSchool-style "ask your district which features are enabled" uncertainty.
2. **"Recently Changed" as a first-class feed**, not a support-forum workaround — directly answers
   the #1 unaddressed gap found across every product researched (§10).
3. **Grade transparency by construction**: every displayed grade shows its category weights and a
   live "what would my grade become if..." projection, instead of a bare percentage a student has
   to reverse-engineer (as Blackbaud users currently must, per §2).
4. **Mobile-first submission flow**, not a desktop feature shrunk to fit a phone — directly
   responds to the most consistent, cross-platform mobile complaint found (§3, §5).
5. **AI that teaches, not answers** — student AI is explicitly configured by the school and steers
   toward explanation over answers; every other product researched treats AI purely as a staff
   productivity add-on, not a designed learning-integrity boundary.
6. **Unified guardian model** instead of a single rigid "parent" role, fixing a concrete, sourced
   Blackbaud complaint (§2, §11).
