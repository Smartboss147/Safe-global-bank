import { useState } from 'react';

export default function Transfers() {
  const [transferType, setTransferType] = useState('internal');

  return (
    <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
      <h2 className="text-2xl font-bold mb-6">Money Transfer</h2>
      
      <div className="flex gap-4 mb-6 border-b pb-2 overflow-x-auto">
        {['internal', 'local', 'international', 'scheduled'].map(type => (
          <button
            key={type}
            onClick={() => setTransferType(type)}
            className={`pb-2 px-2 capitalize font-semibold ${
              transferType === type ? 'text-blue-900 border-b-2 border-blue-900' : 'text-gray-500'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      <form className="space-y-4 max-w-lg" onSubmit={(e) => { e.preventDefault(); alert('Transfer initiated!'); }}>
        {transferType === 'international' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SWIFT / BIC Code</label>
            <input type="text" className="w-full p-3 border border-gray-300 rounded-lg" placeholder="Enter SWIFT code" required />
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Account / IBAN</label>
          <input type="text" className="w-full p-3 border border-gray-300 rounded-lg" placeholder="Account Number or IBAN" required />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
          <div className="relative">
            <span className="absolute left-3 top-3 text-gray-500">$</span>
            <input type="number" min="1" step="0.01" className="w-full p-3 pl-8 border border-gray-300 rounded-lg" placeholder="0.00" required />
          </div>
        </div>

        {transferType === 'scheduled' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input type="date" className="w-full p-3 border border-gray-300 rounded-lg" required />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Reference (Optional)</label>
          <input type="text" className="w-full p-3 border border-gray-300 rounded-lg" placeholder="Payment for..." />
        </div>

        <button type="submit" className="w-full p-3 bg-blue-900 text-white rounded-lg font-semibold hover:bg-blue-800 transition mt-4">
          Review Transfer
        </button>
      </form>
    </div>
  );
}
