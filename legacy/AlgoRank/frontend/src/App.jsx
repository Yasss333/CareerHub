import React, { useEffect } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import LandingPage from "./page/LandingPage";
import HomePage from "./page/HomePage";
import LoginPage from "./page/LoginPage";
import SignUpPage from "./page/SignUpPage";
import { useAuthStore } from "./store/useAuthStore.js";
import { Loader } from "lucide-react";
import Layout from "./layout/Layout.jsx";
import AdminRoute from "./Components/AdminRoute.jsx";
import AddProblem from "./page/AddProblem.jsx";
import ProblemPage from "./page/ProblemPage.jsx";
import ProfilePage from "./page/ProfilePage.jsx";
import RankingPage from "./page/RankingPage.jsx";
const App = () => {
  const { authUser, checkAuth, isCheckingAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);
  if (isCheckingAuth && !authUser) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="size-10 animate-spin" />
      </div>
    );
  }
  return (
    <>
      <div className="flex flex-col items-center justify-start">
        <Toaster />
        <Routes>
          <Route path="/" element={authUser ? <Layout /> : <LandingPage />}>
            <Route
              index
              element={authUser ? <HomePage /> : <Navigate to={"/login"} />}
            />
          </Route>
          <Route
            path="/login"
            element={!authUser ? <LoginPage /> : <Navigate to={"/"} />}
          />

          <Route
            path="/signup"
            element={!authUser ? <SignUpPage /> : <Navigate to={"/"} />}
          />
          <Route path="/problem/:id" 
          element={authUser ? <ProblemPage/> :<Navigate to={"/login"}/>}
          />
          <Route
            path="/profile"
            element={authUser ? <ProfilePage /> : <Navigate to={"/login"} />}
          />
          <Route
            path="/ranking"
            element={authUser ? <RankingPage /> : <Navigate to={"/login"} />}
          />

          <Route element={<AdminRoute />}>
            <Route
              path="/add-problem"
              element={authUser ? <AddProblem /> : <Navigate to="/" />}
            />
          </Route>
        </Routes>
      </div>
    </>
  );
};

export default App;
