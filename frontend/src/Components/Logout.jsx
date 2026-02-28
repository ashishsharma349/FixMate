import { useEffect, useContext } from "react";
import { AuthContext } from "../Context/AuthContext";
import { useNavigate } from "react-router-dom";
import { getAuthHeaders, clearSessionId } from "../utils/api";

function Logout() {
  const { logout } = useContext(AuthContext);
  let navigate = useNavigate();

  useEffect(() => {
    const doLogout = async () => {
      try {
        await fetch("http://localhost:3000/logout", {
          method: "POST",
          headers: { ...getAuthHeaders() },
        });
        logout(); // clears both storages + resets state
        navigate("/");
      } catch (err) {
        console.log(err);
      }
    };

    doLogout();
  }, [logout]);

  return (
    <p>Successfully Logged Out</p>
  );
}

export default Logout;
