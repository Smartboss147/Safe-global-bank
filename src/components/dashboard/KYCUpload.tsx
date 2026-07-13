import { useState } from 'react';
import { db } from '../../lib/firebase';
import { doc, updateDoc, serverTimestamp, setDoc, collection, addDoc } from 'firebase/firestore';
import { UploadCloud, CheckCircle, FileText, AlertCircle } from 'lucide-react';

export default function KYCUpload({ user, userData, onComplete }: any) {
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('passport');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Please select a file to upload.');
      return;
    }
    
    setLoading(true);
    try {
      // In a real app, upload file to Firebase Storage here
      // const storageRef = ref(storage, `kyc/${user.uid}/${file.name}`);
      // await uploadBytes(storageRef, file);
      // const downloadURL = await getDownloadURL(storageRef);
      const downloadURL = 'mock_download_url'; // Mocking storage for simulation
      
      // Save metadata to Firestore 'kyc_documents' collection
      await addDoc(collection(db, 'kyc_documents'), {
        userId: user.uid,
        firstName: userData?.firstName || 'Unknown',
        lastName: userData?.lastName || 'User',
        email: user.email,
        documentType,
        fileName: file.name,
        fileUrl: downloadURL,
        status: 'Pending',
        uploadedAt: serverTimestamp(),
      });

      // Update user status
      await updateDoc(doc(db, 'users', user.uid), {
        kycStatus: 'Pending'
      });

      setSuccess(true);
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 3000);
    } catch (error) {
      console.error('Error uploading KYC document:', error);
      alert('Failed to upload document.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">Upload Successful</h3>
        <p className="text-gray-500 max-w-sm">
          Your documents have been submitted and are pending admin review. This process usually takes 24-48 hours.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Identity Verification (KYC)</h3>
      <p className="text-sm text-gray-500 mb-6">
        Please upload a valid government-issued ID to verify your identity and unlock full account features.
      </p>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Document Type</label>
          <select 
            value={documentType} 
            onChange={(e) => setDocumentType(e.target.value)}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
          >
            <option value="passport">Passport</option>
            <option value="driver_license">Driver's License</option>
            <option value="national_id">National ID Card</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Upload Document</label>
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {file ? (
                <>
                  <FileText className="w-8 h-8 text-blue-500 mb-2" />
                  <p className="text-sm text-gray-700 font-medium">{file.name}</p>
                  <p className="text-xs text-gray-500 mt-1">Click to replace</p>
                </>
              ) : (
                <>
                  <UploadCloud className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500"><span className="font-semibold text-blue-600">Click to upload</span> or drag and drop</p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG or PDF (Max. 10MB)</p>
                </>
              )}
            </div>
            <input type="file" className="hidden" accept=".png,.jpg,.jpeg,.pdf" onChange={handleFileChange} />
          </label>
        </div>

        <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
          <p className="text-sm text-yellow-800">
            Ensure all text is clearly visible, there is no glare, and the document is not cropped.
          </p>
        </div>

        <button 
          onClick={handleUpload}
          disabled={!file || loading}
          className="w-full py-3.5 bg-blue-900 text-white font-bold rounded-xl hover:bg-blue-800 active:scale-95 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
        >
          {loading ? 'Uploading...' : 'Submit Documents'}
        </button>
      </div>
    </div>
  );
}
