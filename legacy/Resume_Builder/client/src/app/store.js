import { configureStore } from "@reduxjs/toolkit";
import authreducer from  "./features/authSlice.js"
export const store =configureStore({
    reducer:{
        auth:authreducer
    }
})