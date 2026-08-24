ALTER TABLE "AcademicYear" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AcademicYear" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_AcademicYear_select ON "AcademicYear" FOR SELECT USING ("schoolId" = current_setting('app.current_school_id', true));
CREATE POLICY tenant_isolation_AcademicYear_insert ON "AcademicYear" FOR INSERT WITH CHECK ("schoolId" = current_setting('app.current_school_id', true));
CREATE POLICY tenant_isolation_AcademicYear_update ON "AcademicYear" FOR UPDATE USING ("schoolId" = current_setting('app.current_school_id', true)) WITH CHECK ("schoolId" = current_setting('app.current_school_id', true));
CREATE POLICY tenant_isolation_AcademicYear_delete ON "AcademicYear" FOR DELETE USING ("schoolId" = current_setting('app.current_school_id', true));

ALTER TABLE "Activity" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Activity" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_Activity_select ON "Activity" FOR SELECT USING ("schoolId" = current_setting('app.current_school_id', true));
CREATE POLICY tenant_isolation_Activity_insert ON "Activity" FOR INSERT WITH CHECK ("schoolId" = current_setting('app.current_school_id', true));
CREATE POLICY tenant_isolation_Activity_update ON "Activity" FOR UPDATE USING ("schoolId" = current_setting('app.current_school_id', true)) WITH CHECK ("schoolId" = current_setting('app.current_school_id', true));
CREATE POLICY tenant_isolation_Activity_delete ON "Activity" FOR DELETE USING ("schoolId" = current_setting('app.current_school_id', true));

ALTER TABLE "AdminProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AdminProfile" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_AdminProfile_select ON "AdminProfile" FOR SELECT USING ("schoolId" = current_setting('app.current_school_id', true));
CREATE POLICY tenant_isolation_AdminProfile_insert ON "AdminProfile" FOR INSERT WITH CHECK ("schoolId" = current_setting('app.current_school_id', true));
CREATE POLICY tenant_isolation_AdminProfile_update ON "AdminProfile" FOR UPDATE USING ("schoolId" = current_setting('app.current_school_id', true)) WITH CHECK ("schoolId" = current_setting('app.current_school_id', true));
CREATE POLICY tenant_isolation_AdminProfile_delete ON "AdminProfile" FOR DELETE USING ("schoolId" = current_setting('app.current_school_id', true));

ALTER TABLE "Announcement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Announcement" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_Announcement_select ON "Announcement" FOR SELECT USING ("schoolId" = current_setting('app.current_school_id', true));
CREATE POLICY tenant_isolation_Announcement_insert ON "Announcement" FOR INSERT WITH CHECK ("schoolId" = current_setting('app.current_school_id', true));
CREATE POLICY tenant_isolation_Announcement_update ON "Announcement" FOR UPDATE USING ("schoolId" = current_setting('app.current_school_id', true)) WITH CHECK ("schoolId" = current_setting('app.current_school_id', true));
CREATE POLICY tenant_isolation_Announcement_delete ON "Announcement" FOR DELETE USING ("schoolId" = current_setting('app.current_school_id', true));

ALTER TABLE "Assignment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Assignment" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_Assignment_select ON "Assignment" FOR SELECT USING ("schoolId" = current_setting('app.current_school_id', true));
CREATE POLICY tenant_isolation_Assignment_insert ON "Assignment" FOR INSERT WITH CHECK ("schoolId" = current_setting('app.current_school_id', true));
CREATE POLICY tenant_isolation_Assignment_update ON "Assignment" FOR UPDATE USING ("schoolId" = current_setting('app.current_school_id', true)) WITH CHECK ("schoolId" = current_setting('app.current_school_id', true));
CREATE POLICY tenant_isolation_Assignment_delete ON "Assignment" FOR DELETE USING ("schoolId" = current_setting('app.current_school_id', true));

ALTER TABLE "AssignmentCategory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AssignmentCategory" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_AssignmentCategory_select ON "AssignmentCategory" FOR SELECT USING ("schoolId" = current_setting('app.current_school_id', true));
CREATE POLICY tenant_isolation_AssignmentCategory_insert ON "AssignmentCategory" FOR INSERT WITH CHECK ("schoolId" = current_setting('app.current_school_id', true));
CREATE POLICY tenant_isolation_AssignmentCategory_update ON "AssignmentCategory" FOR UPDATE USING ("schoolId" = current_setting('app.current_school_id', true)) WITH CHECK ("schoolId" = current_setting('app.current_school_id', true));
CREATE POLICY tenant_isolation_AssignmentCategory_delete ON "AssignmentCategory" FOR DELETE USING ("schoolId" = current_setting('app.current_school_id', true));

ALTER TABLE "Attendance" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Attendance" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_Attendance_select ON "Attendance" FOR SELECT USING ("schoolId" = current_setting('app.current_school_id', true));
CREATE POLICY tenant_isolation_Attendance_insert ON "Attendance" FOR INSERT WITH CHECK ("schoolId" = current_setting('app.current_school_id', true));
CREATE POLICY tenant_isolation_Attendance_update ON "Attendance" FOR UPDATE USING ("schoolId" = current_setting('app.current_school_id', true)) WITH CHECK ("schoolId" = current_setting('app.current_school_id', true));
CREATE POLICY tenant_isolation_Attendance_delete ON "Attendance" FOR DELETE USING ("schoolId" = current_setting('app.current_school_id', true));

ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_AuditLog_select ON "AuditLog" FOR SELECT USING ("schoolId" = current_setting('app.current_school_id', true));
CREATE POLICY tenant_isolation_AuditLog_insert ON "AuditLog" FOR INSERT WITH CHECK ("schoolId" = current_setting('app.current_school_id', true));
CREATE POLICY tenant_isolation_AuditLog_update ON "AuditLog" FOR UPDATE USING ("schoolId" = current_setting('app.current_school_id', true)) WITH CHECK ("schoolId" = current_setting('app.current_school_id', true));
CREATE POLICY tenant_isolation_AuditLog_delete ON "AuditLog" FOR DELETE USING ("schoolId" = current_setting('app.current_school_id', true));

ALTER TABLE "CalendarEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CalendarEvent" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_CalendarEvent_select ON "CalendarEvent" FOR SELECT USING ("schoolId" = current_setting('app.current_school_id', true));
CREATE POLICY tenant_isolation_CalendarEvent_insert ON "CalendarEvent" FOR INSERT WITH CHECK ("schoolId" = current_setting('app.current_school_id', true));
CREATE POLICY tenant_isolation_CalendarEvent_update ON "CalendarEvent" FOR UPDATE USING ("schoolId" = current_setting('app.current_school_id', true)) WITH CHECK ("schoolId" = current_setting('app.current_school_id', true));
CREATE POLICY tenant_isolation_CalendarEvent_delete ON "CalendarEvent" FOR DELETE USING ("schoolId" = current_setting('app.current_school_id', true));

ALTER TABLE "Course" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Course" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_Course_select ON "Course" FOR SELECT USING ("schoolId" = current_setting('app.current_school_id', true));
CREATE POLICY tenant_isolation_Course_insert ON "Course" FOR INSERT WITH CHECK ("schoolId" = current_setting('app.current_school_id', true));
CREATE POLICY tenant_isolation_Course_update ON "Course" FOR UPDATE USING ("schoolId" = current_setting('app.current_school_id', true)) WITH CHECK ("schoolId" = current_setting('app.current_school_id', true));
CREATE POLICY tenant_isolation_Course_delete ON "Course" FOR DELETE USING ("schoolId" = current_setting('app.current_school_id', true));

ALTER TABLE "CourseSection" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CourseSection" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_CourseSection_select ON "CourseSection" FOR SELECT USING ("schoolId" = current_setting('app.current_school_id', true));
CREATE POLICY tenant_isolation_CourseSection_insert ON "CourseSection" FOR INSERT WITH CHECK ("schoolId" = current_setting('app.current_school_id', true));
CREATE POLICY tenant_isolation_CourseSection_update ON "CourseSection" FOR UPDATE USING ("schoolId" = current_setting('app.current_school_id', true)) WITH CHECK ("schoolId" = current_setting('app.current_school_id', true));
CREATE POLICY tenant_isolation_CourseSection_delete ON "CourseSection" FOR DELETE USING ("schoolId" = current_setting('app.current_school_id', true));

ALTER TABLE "Department" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Department" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_Department_select ON "Department" FOR SELECT USING ("schoolId" = current_setting('app.current_school_id', true));
CREATE POLICY tenant_isolation_Department_insert ON "Department" FOR INSERT WITH CHECK ("schoolId" = current_setting('app.current_school_id', true));
CREATE POLICY tenant_isolation_Department_update ON "Department" FOR UPDATE USING ("schoolId" = current_setting('app.current_school_id', true)) WITH CHECK ("schoolId" = current_setting('app.current_school_id', true));
CREATE POLICY tenant_isolation_Department_delete ON "Department" FOR DELETE USING ("schoolId" = current_setting('app.current_school_id', true));

ALTER TABLE "Enrollment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Enrollment" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_Enrollment_select ON "Enrollment" FOR SELECT USING ("schoolId" = current_setting('app.current_school_id', true));
CREATE POLICY tenant_isolation_Enrollment_insert ON "Enrollment" FOR INSERT WITH CHECK ("schoolId" = current_setting('app.current_school_id', true));
CREATE POLICY tenant_isolation_Enrollment_update ON "Enrollment" FOR UPDATE USING ("schoolId" = current_setting('app.current_school_id', true)) WITH CHECK ("schoolId" = current_setting('app.current_school_id', true));
CREATE POLICY tenant_isolation_Enrollment_delete ON "Enrollment" FOR DELETE USING ("schoolId" = current_setting('app.current_school_id', true));

ALTER TABLE "Grade" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Grade" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_Grade_select ON "Grade" FOR SELECT USING ("schoolId" = current_setting('app.current_school_id', true));
CREATE POLICY tenant_isolation_Grade_insert ON "Grade" FOR INSERT WITH CHECK ("schoolId" = current_setting('app.current_school_id', true));
CREATE POLICY tenant_isolation_Grade_update ON "Grade" FOR UPDATE USING ("schoolId" = current_setting('app.current_school_id', true)) WITH CHECK ("schoolId" = current_setting('app.current_school_id', true));
CREATE POLICY tenant_isolation_Grade_delete ON "Grade" FOR DELETE USING ("schoolId" = current_setting('app.current_school_id', true));

ALTER TABLE "MessageThread" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MessageThread" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_MessageThread_select ON "MessageThread" FOR SELECT USING ("schoolId" = current_setting('app.current_school_id', true));
CREATE POLICY tenant_isolation_MessageThread_insert ON "MessageThread" FOR INSERT WITH CHECK ("schoolId" = current_setting('app.current_school_id', true));
CREATE POLICY tenant_isolation_MessageThread_update ON "MessageThread" FOR UPDATE USING ("schoolId" = current_setting('app.current_school_id', true)) WITH CHECK ("schoolId" = current_setting('app.current_school_id', true));
CREATE POLICY tenant_isolation_MessageThread_delete ON "MessageThread" FOR DELETE USING ("schoolId" = current_setting('app.current_school_id', true));

ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_Notification_select ON "Notification" FOR SELECT USING ("schoolId" = current_setting('app.current_school_id', true));
CREATE POLICY tenant_isolation_Notification_insert ON "Notification" FOR INSERT WITH CHECK ("schoolId" = current_setting('app.current_school_id', true));
CREATE POLICY tenant_isolation_Notification_update ON "Notification" FOR UPDATE USING ("schoolId" = current_setting('app.current_school_id', true)) WITH CHECK ("schoolId" = current_setting('app.current_school_id', true));
CREATE POLICY tenant_isolation_Notification_delete ON "Notification" FOR DELETE USING ("schoolId" = current_setting('app.current_school_id', true));

ALTER TABLE "ParentProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ParentProfile" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_ParentProfile_select ON "ParentProfile" FOR SELECT USING ("schoolId" = current_setting('app.current_school_id', true));
CREATE POLICY tenant_isolation_ParentProfile_insert ON "ParentProfile" FOR INSERT WITH CHECK ("schoolId" = current_setting('app.current_school_id', true));
CREATE POLICY tenant_isolation_ParentProfile_update ON "ParentProfile" FOR UPDATE USING ("schoolId" = current_setting('app.current_school_id', true)) WITH CHECK ("schoolId" = current_setting('app.current_school_id', true));
CREATE POLICY tenant_isolation_ParentProfile_delete ON "ParentProfile" FOR DELETE USING ("schoolId" = current_setting('app.current_school_id', true));

ALTER TABLE "Resource" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Resource" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_Resource_select ON "Resource" FOR SELECT USING ("schoolId" = current_setting('app.current_school_id', true));
CREATE POLICY tenant_isolation_Resource_insert ON "Resource" FOR INSERT WITH CHECK ("schoolId" = current_setting('app.current_school_id', true));
CREATE POLICY tenant_isolation_Resource_update ON "Resource" FOR UPDATE USING ("schoolId" = current_setting('app.current_school_id', true)) WITH CHECK ("schoolId" = current_setting('app.current_school_id', true));
CREATE POLICY tenant_isolation_Resource_delete ON "Resource" FOR DELETE USING ("schoolId" = current_setting('app.current_school_id', true));

ALTER TABLE "ScheduleBlock" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ScheduleBlock" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_ScheduleBlock_select ON "ScheduleBlock" FOR SELECT USING ("schoolId" = current_setting('app.current_school_id', true));
CREATE POLICY tenant_isolation_ScheduleBlock_insert ON "ScheduleBlock" FOR INSERT WITH CHECK ("schoolId" = current_setting('app.current_school_id', true));
CREATE POLICY tenant_isolation_ScheduleBlock_update ON "ScheduleBlock" FOR UPDATE USING ("schoolId" = current_setting('app.current_school_id', true)) WITH CHECK ("schoolId" = current_setting('app.current_school_id', true));
CREATE POLICY tenant_isolation_ScheduleBlock_delete ON "ScheduleBlock" FOR DELETE USING ("schoolId" = current_setting('app.current_school_id', true));

ALTER TABLE "StudentProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StudentProfile" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_StudentProfile_select ON "StudentProfile" FOR SELECT USING ("schoolId" = current_setting('app.current_school_id', true));
CREATE POLICY tenant_isolation_StudentProfile_insert ON "StudentProfile" FOR INSERT WITH CHECK ("schoolId" = current_setting('app.current_school_id', true));
CREATE POLICY tenant_isolation_StudentProfile_update ON "StudentProfile" FOR UPDATE USING ("schoolId" = current_setting('app.current_school_id', true)) WITH CHECK ("schoolId" = current_setting('app.current_school_id', true));
CREATE POLICY tenant_isolation_StudentProfile_delete ON "StudentProfile" FOR DELETE USING ("schoolId" = current_setting('app.current_school_id', true));

ALTER TABLE "Submission" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Submission" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_Submission_select ON "Submission" FOR SELECT USING ("schoolId" = current_setting('app.current_school_id', true));
CREATE POLICY tenant_isolation_Submission_insert ON "Submission" FOR INSERT WITH CHECK ("schoolId" = current_setting('app.current_school_id', true));
CREATE POLICY tenant_isolation_Submission_update ON "Submission" FOR UPDATE USING ("schoolId" = current_setting('app.current_school_id', true)) WITH CHECK ("schoolId" = current_setting('app.current_school_id', true));
CREATE POLICY tenant_isolation_Submission_delete ON "Submission" FOR DELETE USING ("schoolId" = current_setting('app.current_school_id', true));

ALTER TABLE "TeacherProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TeacherProfile" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_TeacherProfile_select ON "TeacherProfile" FOR SELECT USING ("schoolId" = current_setting('app.current_school_id', true));
CREATE POLICY tenant_isolation_TeacherProfile_insert ON "TeacherProfile" FOR INSERT WITH CHECK ("schoolId" = current_setting('app.current_school_id', true));
CREATE POLICY tenant_isolation_TeacherProfile_update ON "TeacherProfile" FOR UPDATE USING ("schoolId" = current_setting('app.current_school_id', true)) WITH CHECK ("schoolId" = current_setting('app.current_school_id', true));
CREATE POLICY tenant_isolation_TeacherProfile_delete ON "TeacherProfile" FOR DELETE USING ("schoolId" = current_setting('app.current_school_id', true));

ALTER TABLE "Team" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Team" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_Team_select ON "Team" FOR SELECT USING ("schoolId" = current_setting('app.current_school_id', true));
CREATE POLICY tenant_isolation_Team_insert ON "Team" FOR INSERT WITH CHECK ("schoolId" = current_setting('app.current_school_id', true));
CREATE POLICY tenant_isolation_Team_update ON "Team" FOR UPDATE USING ("schoolId" = current_setting('app.current_school_id', true)) WITH CHECK ("schoolId" = current_setting('app.current_school_id', true));
CREATE POLICY tenant_isolation_Team_delete ON "Team" FOR DELETE USING ("schoolId" = current_setting('app.current_school_id', true));

ALTER TABLE "Term" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Term" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_Term_select ON "Term" FOR SELECT USING ("schoolId" = current_setting('app.current_school_id', true));
CREATE POLICY tenant_isolation_Term_insert ON "Term" FOR INSERT WITH CHECK ("schoolId" = current_setting('app.current_school_id', true));
CREATE POLICY tenant_isolation_Term_update ON "Term" FOR UPDATE USING ("schoolId" = current_setting('app.current_school_id', true)) WITH CHECK ("schoolId" = current_setting('app.current_school_id', true));
CREATE POLICY tenant_isolation_Term_delete ON "Term" FOR DELETE USING ("schoolId" = current_setting('app.current_school_id', true));

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_User_select ON "User" FOR SELECT USING ("schoolId" = current_setting('app.current_school_id', true));
CREATE POLICY tenant_isolation_User_insert ON "User" FOR INSERT WITH CHECK ("schoolId" = current_setting('app.current_school_id', true));
CREATE POLICY tenant_isolation_User_update ON "User" FOR UPDATE USING ("schoolId" = current_setting('app.current_school_id', true)) WITH CHECK ("schoolId" = current_setting('app.current_school_id', true));
CREATE POLICY tenant_isolation_User_delete ON "User" FOR DELETE USING ("schoolId" = current_setting('app.current_school_id', true));

