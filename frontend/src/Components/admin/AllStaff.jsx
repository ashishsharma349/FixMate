import { use, useEffect } from "react";

function StaffCard(){

} 


function AllStaff() {
const [Staff,setStaff]= useState([])

useEffect(()=>{
fetch()
},[])


return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {
        Staff.map((c) => (
        <StaffCard
          key={c._id}
          data={c}
        />
      ))}
    </div>
}

export default AllStaff;