import {create }  from "zustand";
import api from "../lib/axios";
import {toast} from "react-hot-toast";
import { get } from "react-hook-form";

export const useProblemStore=create((set)=>({
    problem:null,
    problems:[],
    solvedProblems:[],
    isProblemLoading :false ,
    isProblemsLoading :false,

    getAllProblems:async()=>{
        try {
            set({isProblemsLoading:true})
            
            const res= await api.get("/problems/get-all-problems");
            console.log("API Response:", res.data);
            
            if (res.data && res.data.problems) {
                set({problems:res.data.problems})
            } else {
                console.error("Unexpected response structure:", res.data);
                set({problems:[]})
            }
        } catch (error) {
            console.log("Error getting all problems ", error);
            toast.error("Failed Getting ALl problems")
            set({problems:[]})
        }
        finally{
            set({isProblemsLoading:false})
            
        }
    },
    getProblemById:async(id)=>{
        try {
            set({isProblemLoading:true})
            const res=await api.get(`/problems/get-problem/${id}`)
            set({problem:res.data.problem});
            toast.success("Success in getting the problem ")
        } catch (error) {
            console.log("Error in getting this problem", error);
            toast.error("Failed to get the problem ")
        }
        finally{
            set({isProblemLoading:false})
        }
    },
    getSolvedProblemByUser:async()=>{
        try {
            set({isProblemsLoading:true})
            const res=await api.get("/problems/get-solved-problem");
            set({problems:res.data.problems})
        } catch (error) {
            console.log("Error in loading the problems solved by the user ", error);
            toast.error("Failed to get problems solved by you ")
            
        }
        finally{
            set({isProblemsLoading:false})
        }
    },
}))
