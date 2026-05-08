/**
 * RegisterForm - User registration form component
 */
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from '@tanstack/react-form';
import { register } from '../api';
import { useAuthStore } from '../store/authStore';

export const RegisterForm: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { setUser, setTokens } = useAuthStore();

  const form = useForm({
    defaultValues: {
      nombre: '',
      email: '',
      password: '',
      confirmPassword: '',
      telefono: '',
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true);
      setError(null);

      // Validate passwords match
      if (value.password !== value.confirmPassword) {
        setError('Passwords do not match');
        setIsSubmitting(false);
        return;
      }

      try {
        const response = await register({
          nombre: value.nombre,
          email: value.email,
          password: value.password,
          telefono: value.telefono || undefined,
        });

        // Store user and tokens
        setUser(response.user);
        setTokens(response.tokens);

        // Redirect to home
        navigate('/');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Registration failed';
        setError(message);
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
        Create Account
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
        {/* Name Field */}
        <form.Field
          name="nombre"
          validators={{
            onChange: ({ value }) => {
              if (!value) return 'Name is required';
              if (value.length < 3) return 'Name must be at least 3 characters';
            },
          }}
          children={(field) => (
            <div>
              <label
                htmlFor={field.name}
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Full Name
              </label>
              <input
                {...field.getInputProps()}
                type="text"
                placeholder="John Doe"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {field.state.meta.errors && (
                <span className="text-sm text-red-600">
                  {field.state.meta.errors.join(', ')}
                </span>
              )}
            </div>
          )}
        />

        {/* Email Field */}
        <form.Field
          name="email"
          validators={{
            onChange: ({ value }) => {
              if (!value) return 'Email is required';
              if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                return 'Please enter a valid email';
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
                {...field.getInputProps()}
                type="email"
                placeholder="you@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {field.state.meta.errors && (
                <span className="text-sm text-red-600">
                  {field.state.meta.errors.join(', ')}
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
              if (!value) return 'Password is required';
              if (value.length < 8) return 'Password must be at least 8 characters';
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
                {...field.getInputProps()}
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {field.state.meta.errors && (
                <span className="text-sm text-red-600">
                  {field.state.meta.errors.join(', ')}
                </span>
              )}
            </div>
          )}
        />

        {/* Confirm Password Field */}
        <form.Field
          name="confirmPassword"
          validators={{
            onChange: ({ value }) => {
              if (!value) return 'Confirm password is required';
            },
          }}
          children={(field) => (
            <div>
              <label
                htmlFor={field.name}
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Confirm Password
              </label>
              <input
                {...field.getInputProps()}
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {field.state.meta.errors && (
                <span className="text-sm text-red-600">
                  {field.state.meta.errors.join(', ')}
                </span>
              )}
            </div>
          )}
        />

        {/* Phone Field (Optional) */}
        <form.Field
          name="telefono"
          children={(field) => (
            <div>
              <label
                htmlFor={field.name}
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Phone (Optional)
              </label>
              <input
                {...field.getInputProps()}
                type="tel"
                placeholder="+1 (555) 000-0000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}
        />

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Creating account...' : 'Sign Up'}
        </button>
      </form>

      {/* Sign In Link */}
      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};
