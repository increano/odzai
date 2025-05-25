'use client';

import { PasswordResetForm } from '../../components/auth/PasswordResetForm';
import { ClientWrapper } from '@/components/ClientWrapper';

export default function ResetPasswordPage() {
  return (
    <ClientWrapper>
    <div className="h-screen w-full flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Odzai Budget</h1>
          <p className="text-gray-600 mt-2">
            Set your new password
          </p>
        </div>
        
        <PasswordResetForm mode="reset" />
      </div>
    </div>
    </ClientWrapper>
  );
} 