// A requested account type is an application, never an authorization grant.
export const mentorRegistrationState = (requestedMentor) => ({
  role: 'USER', isAlumniMentor: false, mentorApprovalStatus: requestedMentor ? 'PENDING' : 'NONE',
});

export const mentorApplicationState = (user) => {
  const approved = user.mentorApprovalStatus === 'APPROVED' && user.isAlumniMentor === true;
  return {
    role: user.role === 'ADMIN' ? 'ADMIN' : approved ? 'MENTOR' : 'USER',
    isAlumniMentor: approved, mentorApprovalStatus: approved ? 'APPROVED' : 'PENDING',
  };
};

export const canManageMentorFeatures = (user) => Boolean(user && (
  user.role === 'ADMIN' || (user.isAlumniMentor === true && user.mentorApprovalStatus === 'APPROVED')
));
