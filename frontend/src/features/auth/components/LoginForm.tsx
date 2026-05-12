/**
 * LoginForm - User login form component
 */
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "@tanstack/react-form";
import { login } from "../api";
import { useAuthStore } from "../store/authStore";

export const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { setUser, setTokens } = useAuthStore();

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true);
      setError(null);

      try {
        const response = await login({
          email: value.email,
          password: value.password,
        });

        // Store user and tokens
        setUser(response.user);
        setTokens(response.tokens);

        // Redirect to home
        navigate("/");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Login failed";
        setError(message);
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
        Sign In
      </h2>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className="space-y-4"
      >
        {/* Email Field */}
        <form.Field
          name="email"
          validators={{
            onChange: ({ value }) => {
              if (!value) return "Email is required";
              if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                return "Please enter a valid email";
              }
            },
          }}
          children={(field) => (
            <div>
              <label
                htmlFor={field.name}
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email
              </label>
              <input
                name={field.name}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                type="email"
                placeholder="you@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {field.state.meta.errors && (
                <span className="text-sm text-red-600">
                  {field.state.meta.errors.join(", ")}
                </span>
              )}
            </div>
          )}
        />

        {/* Password Field */}
        <form.Field
          name="password"
          validators={{
            onChange: ({ value }) => {
              if (!value) return "Password is required";
              if (value.length < 1) return "Invalid password";
            },
          }}
          children={(field) => (
            <div>
              <label
                htmlFor={field.name}
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <input
                name={field.name}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {field.state.meta.errors && (
                <span className="text-sm text-red-600">
                  {field.state.meta.errors.join(", ")}
                </span>
              )}
            </div>
          )}
        />

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? "Signing in..." : "Sign In"}
        </button>
      </form>

      {/* Sign Up Link */}
      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};
