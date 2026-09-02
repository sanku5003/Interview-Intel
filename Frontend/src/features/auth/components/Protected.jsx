import { Navigate } from "react-router";
import { useAuth } from "../Hooks/useAuth";
import Loading from "./Loading";
import React from "react";

const Protected = ({ children }) => {
  const { loading, user } = useAuth();
  
  if (loading) {
    return <Loading />;
  }

  if (!user) {
    return <Navigate to={"/login"}></Navigate>;
  }
  return children;
};

export default Protected;
