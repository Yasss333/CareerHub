UPDATE "User"
SET "role" = 'MENTOR'
WHERE "role" = 'USER'
  AND "isAlumniMentor" = true
  AND "mentorApprovalStatus" = 'APPROVED';
