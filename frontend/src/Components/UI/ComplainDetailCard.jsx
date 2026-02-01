import { useLocation } from "react-router-dom";
import { AuthContext } from "../../Context/AuthContext";
import { useContext } from "react";
function ComplainDetailCard() {
  
  const {role}=useContext(AuthContext);
  console.log("[Whos is accessing the Page ? :]",role);
  const { state: complain } = useLocation(); // get the passed object
  // console.log(complain);
  
  return (
    <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md border p-6">
      
      {/* Title */}
      <h1 className="text-2xl font-semibold mb-3">
        {complain.title}
      </h1>
      {/* Status & Priority */}
      <div className="flex gap-3 mb-5 text-sm">
        <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-800">
          Status: {complain.status}
        </span>
        <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800">
          Priority: {complain.priority}
        </span>
      </div>

      {/* Proof Image */}
      <div className="w-full h-80 mb-6 overflow-hidden rounded-lg border">
        <img
          src={complain.image_url}
          alt="Complaint proof"
          className="w-full h-full object-contain"
        />
      </div>

      {/* Description */}
      <div className="mb-5">
        <h2 className="text-lg font-medium mb-1">Description</h2>
        <p className="text-gray-700 leading-relaxed">
          {complain.description}
        </p>
      </div>

      {/* Meta Information */}
      <div className="text-sm text-gray-500 space-y-1">
        <p><strong>Complaint ID:</strong> {complain._id}</p>
        <p><strong>Resident ID:</strong> {complain.resident}</p>
        <p><strong>Assigned Staff:</strong> {complain.assignedStaff ?? "Not assigned"}</p>
        <p>
          <strong>Created At:</strong>{" "}
          {new Date(complain.createdAt).toLocaleString()}
        </p>
      </div>

    </div>
  );
}

export default ComplainDetailCard;
