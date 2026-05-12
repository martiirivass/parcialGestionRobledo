/**
 * RegisterPage - Registration page
 */
import React from "react";
import { RegisterForm } from "../features/auth/components/RegisterForm";

export const RegisterPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4">
      <RegisterForm />
    </div>
  );
};
