import { useEffect, useContext } from "react";
import { AuthContext } from "../Context/AuthContext";
import { useNavigate } from "react-router-dom";
import { getAuthHeaders, clearToken, API } from "../utils/api";

function Logout() {
  const { logout } = useContext(AuthContext);
  let navigate = useNavigate();

  useEffect(() => {
    const doLogout = async () => {
      try {
        // Tell server to revoke refresh token (fire-and-forget)
        await fetch(`${API}/logout`, {
          method: "POST",
          headers: { ...getAuthHeaders() },
          credentials: "include", // sends refresh token cookie for revocation
        });
        logout(); // clears token + resets state
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
