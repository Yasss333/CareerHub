import { create } from "zustand";
import api from "../lib/axios";
import toast from "react-hot-toast";

export const useSubmissionStore = create((set, get) => ({
  isLoading: false,
  submissions: [],
  submission: null,
  submissionCount: null,

  getAllSubmissions: async () => {
    try {
      set({ isLoading: true });
      const res = await api.get("/submission/get-all-submission");

      set({ submissions: res.data.submissions });

      toast.success(res.data.message);
    } catch (error) {
      console.log("Error getting all submissions", error);
      toast.error("Error getting all submissions");
    } finally {
      set({ isLoading: false });
    }
  },

  getSubmissionForProblem: async (problemId) => {
    try {
      set({ isLoading: true });
      const res = await api.get(
        `/submission/get-submissions/${problemId}`
      );

      // Backend returns the list under `submission` (see submission_details.js).
      // Read both keys defensively for compatibility.
      const submissionsData = res.data.submissions || res.data.submission || [];
      set({ 
        submission: submissionsData.length > 0 ? submissionsData[0] : null,
        submissions: submissionsData 
      });

    } catch (error) {
      console.log("Error getting submissions for problem", error);
      toast.error("Error getting submissions for problem");
      set({ submissions: [], submission: null });
    } finally {
      set({ isLoading: false });
    }
  },

  getSubmissionCountForProblem: async (problemID) => {
    try {
      const res = await api.get(
        `/submission/get-submission-count/${problemID}`
      );                

      set({ submissionCount: res.data.count });
    } catch (error) {
      console.log("Error getting submission count for problem", error);
      toast.error("Error getting submission count for problem");
    }
  },
}));