const fs = require('fs');
let code = fs.readFileSync('src/components/UserDashboard.tsx', 'utf8');

const badCodeStart = `            await updateDoc(doc(db, 'products', product.id), {`;
const badCodeEnd = `            <div className="flex-1 grid grid-cols-2 gap-3">`;

const goodCode = `            await updateDoc(doc(db, 'products', product.id), {
              warehouseStock: increment(-qty)
            });
          } else if (activeTab === 'Stock Return') {
            await updateDoc(doc(db, 'products', product.id), {
              warehouseStock: increment(qty)
            });
          }
        }
      }));

      setIsModalOpen(false);
    } catch (error) {
      console.error("Error adding transactions: ", error);
      alert("មានបញ្ហាក្នុងការរក្សាទុកទិន្នន័យ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* History Section */}
      <div className="bg-white rounded-t-3xl md:rounded-3xl border-b-0 shadow-sm border border-slate-100 overflow-hidden flex flex-col flex-1 min-h-0 p-5 md:p-6">
        <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4 shrink-0">
          <div>
            <h3 className="text-base md:text-lg font-black text-slate-800">
              {activeTab === 'Report' 
                ? 'របាយការណ៍ស្តុកសរុប'
                : activeTab === 'Stock Order'
                ? 'ស្តុកកម្មង់'
                : \`ប្រវត្តិប្រតិបត្តិការ\${activeTab === 'Stock Sold' ? 'ស្តុកលក់ចេញ' : activeTab === 'Stock Out' ? 'ស្តុកឡើងឡាន' : 'ស្តុកត្រឡប់'}\`}
            </h3>
            <p className="text-slate-500 text-[10px] md:text-xs mt-0.5 font-medium">
              {activeTab === 'Report' 
                ? 'ព័ត៌មាននិងចំនួនស្តុកលម្អិតសម្រាប់ទំនិញនីមួយៗ'
                : activeTab === 'Stock Order'
                ? 'បញ្ជីកម្មង់ទំនិញទាំងអស់របស់សមាជិក'
                : \`របាយការណ៍\${activeTab === 'Stock Sold' ? 'ស្តុកលក់ចេញ' : activeTab === 'Stock Out' ? 'ស្តុកឡើងឡាន' : 'ស្តុកត្រឡប់'}\`}
            </p>
          </div>
          {activeTab !== 'Report' && activeTab !== 'Stock Order' ? (
            <button
              onClick={openModal}
              className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs md:text-sm px-4 py-2.5 rounded-2xl font-black shadow-md shadow-emerald-600/20 active:scale-95 transition cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span>បញ្ចូលទិន្នន័យ</span>
            </button>
          ) : (
            activeTab === 'Stock Order' && (
              <button
                onClick={openOrderModal}
                className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs md:text-sm px-4 py-2.5 rounded-2xl font-black shadow-md shadow-indigo-600/20 active:scale-95 transition cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                <span>បង្កើតការកម្មង់</span>
              </button>
            )
          )}
        </div>
        
        <div className="bg-slate-50 p-3.5 rounded-2xl mb-4 border border-slate-100 flex flex-col sm:flex-row sm:items-end gap-3 shrink-0">
          <div className="flex-1 grid grid-cols-2 gap-3">`;

const lines = code.split('\n');
let startIdx = -1;
let endIdx = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("if (activeTab === 'Stock Out') {")) {
    // Check if the next line is the messed up one
    if (lines[i+1].includes("<div className=\"bg-slate-50")) {
      startIdx = i + 1;
    }
  }
}

if (startIdx !== -1) {
  for (let i = startIdx; i < lines.length; i++) {
    if (lines[i].includes('{activeTab === \'Report\' && (')) {
      if (lines[i+1] && lines[i+1].includes('<div className="bg-slate-50')) {
        endIdx = i + 2;
        break;
      }
    }
  }
}

if (startIdx !== -1 && endIdx !== -1) {
  lines.splice(startIdx, endIdx - startIdx + 1, goodCode);
  fs.writeFileSync('src/components/UserDashboard.tsx', lines.join('\n'));
  console.log('Fixed!');
} else {
  console.log('Could not find boundaries', startIdx, endIdx);
}
