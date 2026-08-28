'use client';

import { useState } from 'react';

export default function MenuUploadPage() {
  const [file, setFile] = useState<File | null>(null);

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    alert('Menu uploaded successfully! (Firebase storage integration pending for file parse)');
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">Menu Management</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
        <h2 className="text-xl font-semibold mb-4">Upload Menu (CSV)</h2>
        <p className="text-gray-600 mb-4 text-sm">
          Upload your restaurant menu in CSV format. Need help? 
          <a href="/sample-menu.csv" download className="text-blue-600 ml-1 hover:underline">Download Sample CSV</a>
        </p>

        <form onSubmit={handleUpload} className="flex flex-col gap-4">
          <input 
            type="file" 
            accept=".csv" 
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="border p-2 rounded"
          />
          <button 
            type="submit" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium w-fit"
          >
            Upload Menu
          </button>
        </form>
      </div>
    </div>
  );
}
