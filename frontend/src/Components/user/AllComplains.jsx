// import { useEffect ,useState} from "react";
// import { useNavigate } from "react-router-dom";

// function ComplainCard({data}) {
//   const navigate= useNavigate();

//   const show_detail=()=>{
//   navigate("/ComplainDetail/${data._id}",{state:data})
//   }  

//   // console.log(data);
//   return (
//     <div className="max-w-sm rounded-xl shadow-md border p-4 bg-white">
//       {/* Title */}
//       <h2 className="text-xl font-semibold mb-3">
//         {data.title}
//       </h2>
//       {/* Image */}
//       <div className="w-full h-48 mb-3 overflow-hidden rounded-lg">
//         <img
//           src={data.image_url}
//           alt="Complaint proof"
//           className="w-full h-full object-cover"
//         />
//       </div>
//       {/* Status */}
//       <div className="text-sm">
//         Status:
//         <span className="ml-2 font-medium">
//           {data.status}
//         </span>
//         <div>
//             <button onClick={show_detail}> See Details</button>
//         </div>
//       </div>
//     </div>
//   );
// }

// function ShowComplains(){
// const [complains,setComplains]=useState([]);

// useEffect(()=>{
// fetch("http://localhost:3000/users/All-Complains",{
// method:"GET",
// }).then(res=>{
//     return res.json()
// }).then(data=>{
// // console.log(data);
// // setComplains(complains=>[...complains,data.complains]);  duplicacy error bcoz abi ek data ha khali
// setComplains(data.complains);
// })
// },[])

// return (
//     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//       {
//         complains.map((c) => (
//         <ComplainCard
//           key={c._id}
//           data={c}
//         />
//       ))
//       }
//     </div>
//   );
// }
// export default ShowComplains;

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function ComplainCard({ data }) {
  const navigate = useNavigate();

  const show_detail = () => {
    navigate(`/ComplainDetail/${data._id}`, { state: data });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "resolved":
        return "bg-green-100 text-green-700 border-green-200";
      case "in-progress":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
    }
  };

  return (
    <div className="bg-white rounded-[30px] shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
      <div className="relative w-full h-48 overflow-hidden bg-gray-100">
        <img
          src={data.image_url}
          alt="Complaint proof"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div
          className={`absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(
            data.status
          )}`}
        >
          {data.status}
        </div>
      </div>

      <div className="p-6">
        <p className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.2em] mb-1">
          {data.category || "Maintenance"}
        </p>
        <h2 className="text-xl font-extrabold text-[#1a365d] mb-4 truncate">
          {data.title}
        </h2>

        <div className="flex items-center justify-between border-t border-gray-50 pt-4">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 font-bold uppercase">
              Date Reported
            </span>
            <span className="text-xs font-semibold text-gray-600">
              {new Date(data.createdAt).toLocaleDateString()}
            </span>
          </div>

          <button
            onClick={show_detail}
            className="bg-[#25334d] text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition"
          >
            See Details
          </button>
        </div>
      </div>
    </div>
  );
}

function ShowComplains() {
  const [complains, setComplains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("http://localhost:3000/users/All-Complains", {
      method: "GET",
      credentials: "include", 
    })
      .then((res) => {
        if (!res.ok) {
          if (res.status === 401) throw new Error("Not authenticated");
          throw new Error("Failed to fetch complains");
        }
        return res.json();
      })
      .then((data) => {
        setComplains(Array.isArray(data.complains) ? data.complains : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
        setComplains([]);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1a365d]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500 font-semibold">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-black text-[#1a365d] tracking-tight">
            Your Complains
          </h1>
          <p className="text-sm text-gray-500 font-medium">
            Track and manage your reported issues
          </p>
        </div>
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-xl shadow-inner">
          📋
        </div>
      </div>

      {complains.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {complains.map((c) => (
            <ComplainCard key={c._id} data={c} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-200">
          <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">
            No complains found
          </p>
        </div>
      )}
    </div>
  );
}

export default ShowComplains;
