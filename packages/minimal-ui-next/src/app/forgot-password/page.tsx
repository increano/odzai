'use client';

import { PasswordResetForm } from '../../components/auth/PasswordResetForm';

export default function ForgotPasswordPage() {
  return (
    <div className="h-screen w-full flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Odzai Budget</h1>
          <p className="text-gray-600 mt-2">
            Reset your password
          </p>
        </div>
        
        <PasswordResetForm mode="request" />
      </div>
    </div>
  );
} 