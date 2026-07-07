'use client';

import { useFormStatus } from 'react-dom';
import { Spinner } from './Spinner';

export function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-700 focus:ring-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
    >
      {pending ? (
        <>
          <Spinner />
          <span>Converting...</span>
        </>
      ) : (
        'Convert to Excel'
      )}
    </button>
  );
}
