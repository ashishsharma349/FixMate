import { useEffect, useState } from "react";

function Task() {
  const [complains, setComplains] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [photos, setPhotos] = useState({}); 
  const [amounts, setAmounts] = useState({}); 
  const [worklogs, setWorklogs] = useState({}); 
  const [usedMaterials, setUsedMaterials] = useState({}); 

  const mockInventory = ["Cement (kg)", "LED Bulb 9W", "Tap Washer", "Paint (L)"];

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const res = await fetch("http://localhost:3000/users/Task", { credentials: "include" });
        const data = await res.json();
        if (data && data.complains) {
          setComplains(data.complains);
        }
      } catch (err) {
        console.error("Error fetching tasks:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTask();
  }, []);

  const addMaterial = (taskId, itemName) => {
    if (!itemName) return;
    const currentItems = usedMaterials[taskId] || [];
    if (currentItems.find(item => item.name === itemName)) return;
    setUsedMaterials({ ...usedMaterials, [taskId]: [...currentItems, { name: itemName, qty: 1 }] });
  };

  // --- RESTORED: REMOVE ITEM LOGIC ---
  const removeMaterial = (taskId, index) => {
    const updated = usedMaterials[taskId].filter((_, i) => i !== index);
    setUsedMaterials({ ...usedMaterials, [taskId]: updated });
  };

  const handleComplete = (taskId) => {
    const finalData = {
        taskId: taskId, 
        payAmount: amounts[taskId],
        worklog: worklogs[taskId],
        materials: usedMaterials[taskId],
        proof: photos[taskId]
    };
    console.log("Submitting to Backend:", finalData);
    alert(`Task ${taskId} submitted!`);
  };

  if (loading) return <div className="p-10 text-center font-bold text-slate-400 uppercase tracking-widest">Loading Assignments...</div>;

  return (
    <div className="max-w-md mx-auto bg-slate-50 min-h-screen pb-10 font-sans">
      <header className="bg-white px-6 py-5 border-b sticky top-0 z-10 shadow-sm">
        <h1 className="text-lg font-black uppercase tracking-tight">Worklog & Inventory</h1>
      </header>

      <div className="p-5 space-y-6">
        {complains.map((task) => (
          <div key={task._id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
            <div className="mb-4">
               <p className="text-[10px] font-bold text-slate-300 mb-1">ID: {task._id}</p>
               <h2 className="text-xl font-extrabold text-slate-800 leading-tight">{task.title}</h2>
            </div>

            {/* Worklog Description (Module 7.3) */}
            <div className="mb-4">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1 mb-1">Work Done</label>
              <textarea 
                className="w-full p-4 bg-slate-50 rounded-2xl border-none text-sm h-20 focus:ring-1 focus:ring-slate-200"
                placeholder="Briefly describe the fix..."
                onChange={(e) => setWorklogs({...worklogs, [task._id]: e.target.value})}
              />
            </div>

            {/* Inventory Selection (Module 7.4) */}
            <div className="mb-4">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1 mb-1">Materials Used</label>
              <select 
                className="w-full p-3 bg-blue-50 text-blue-700 rounded-xl border-none font-bold text-xs"
                onChange={(e) => { addMaterial(task._id, e.target.value); e.target.value = ""; }}
              >
                <option value="">+ Add From Inventory</option>
                {mockInventory.map(i => <option key={i} value={i}>{i}</option>)}
              </select>

              {/* RESTORED: Material list with Cross button */}
              <div className="mt-3 space-y-2">
                {(usedMaterials[task._id] || []).map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-50 p-2 px-3 rounded-xl border border-slate-100">
                    <span className="text-[11px] font-bold text-slate-600">{item.name}</span>
                    <div className="flex items-center gap-3">
                        <input 
                        type="number" 
                        className="w-10 text-center bg-white rounded-lg border border-slate-200 text-xs font-bold py-1" 
                        value={item.qty}
                        onChange={(e) => {
                            const updated = [...usedMaterials[task._id]];
                            updated[idx].qty = Math.max(1, parseInt(e.target.value) || 1);
                            setUsedMaterials({...usedMaterials, [task._id]: updated});
                        }}
                        />
                        <button 
                            onClick={() => removeMaterial(task._id, idx)} 
                            className="text-red-400 hover:text-red-600 font-bold px-1"
                        >
                            ✕
                        </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Labour Charges */}
            <div className="mb-6">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1 mb-1">Pay Amount (₹)</label>
              <input 
                type="number" 
                placeholder="50"
                className="w-full p-4 bg-slate-50 rounded-2xl border-none font-black text-xl text-slate-800"
                onChange={(e) => setAmounts({...amounts, [task._id]: e.target.value})}
              />
            </div>

            {/* Proof Image */}
            <div className={`py-8 rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center mb-4 transition-all ${photos[task._id] ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
              <label className="cursor-pointer flex flex-col items-center">
                <span className="text-3xl mb-1">{photos[task._id] ? '✅' : '📸'}</span>
                <span className="text-[9px] font-black uppercase text-slate-400">{photos[task._id] ? 'Proof Attached' : 'Take Photo'}</span>
                <input type="file" className="hidden" onChange={(e) => setPhotos({...photos, [task._id]: e.target.files[0]})} />
              </label>
            </div>

            <button 
              onClick={() => handleComplete(task._id)}
              disabled={!photos[task._id]}
              className={`w-full py-5 rounded-2xl font-black text-[10px] tracking-[0.2em] transition-all ${
                photos[task._id] ? 'bg-slate-900 text-white shadow-xl shadow-slate-200' : 'bg-slate-100 text-slate-300 cursor-not-allowed'
              }`}
            >
              COMPLETE TASK
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Task;