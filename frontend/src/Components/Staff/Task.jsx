// import { useEffect } from "react";

// function Task() {
// useEffect(()=>{

// const fetchTask= async()=>{
// try{    
// const res= await fetch("http://localhost:3000/users/Task",{ credentials: "include"})
// const data= await res.json()
// console.log("[Fetched Task :]",data);
// }
// catch(err){
//     console.log(err);
// }}//fetch task
// fetchTask();

// },[])

// return <p>
//     Task Component
// </p>
// }

// export default Task;  complete this component acc to theme chosen



import { useEffect, useState } from "react";

function Task() {
  const [complains, setComplains] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const res = await fetch("http://localhost:3000/users/Task", {
          credentials: "include",
        });
        const data = await res.json();
        
        // Accessing the 'complains' array from your console-logged Object
        console.log("[Fetched Task :]", data);
        if (data && data.complains) {
          setComplains(data.complains);
        }
      } catch (err) {
        console.error("Error fetching FixMate task:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTask();
  }, []);

  if (loading) return <div className="p-4 text-center">Loading Job Details...</div>;

  // Handle the empty array state shown in your log
  if (complains.length === 0) {
    return (
      <div className="max-w-md mx-auto bg-slate-50 min-h-screen font-sans">
        <div className="bg-white p-4 flex items-center shadow-sm">
          <h1 className="text-lg font-bold">My Current Job</h1>
        </div>
        <div className="p-10 text-center text-slate-500">
          <p>No active complains found in your queue.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-slate-50 min-h-screen font-sans text-slate-900">
      <div className="bg-white p-4 flex items-center shadow-sm">
        <button className="text-xl mr-4">{"<"}</button>
        <h1 className="text-lg font-bold">My Current Job</h1>
      </div>

      <div className="p-6">
        {complains.map((task, index) => (
          <div key={index} className="bg-white rounded-2xl p-6 shadow-md border border-slate-100 mb-4">
            <h2 className="text-2xl font-bold text-slate-800 mb-1">
              {task.title || "No Title"}
            </h2>
            <p className="text-blue-600 font-semibold mb-4">
              {task.location || "Location Not Specified"}
            </p>

            <div className="space-y-2 border-t pt-4 text-sm text-slate-600">
              <p><span className="font-medium text-slate-400">Reported by:</span> {task.reportedBy || "Anonymous"}</p>
              <p><span className="font-medium text-slate-400">Building:</span> {task.building || "N/A"}</p>
            </div>
          </div>
        ))}

        <div className="mt-8 flex flex-col items-center justify-center">
          <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-2">
             <span className="text-white text-3xl">📷</span> 
          </div>
          <p className="font-semibold text-slate-700">Capture Proof of Work</p>
        </div>
      </div>

      <div className="fixed bottom-10 left-0 right-0 px-6">
        <div className="bg-slate-800 text-white py-4 rounded-full text-center font-bold tracking-widest relative overflow-hidden">
          SLIDE TO COMPLETE 
          <div className="absolute left-1 top-1 bottom-1 w-12 bg-white rounded-full flex items-center justify-center text-slate-800">
            →
          </div>
        </div>
      </div>
    </div>
  );
}

export default Task;