import { Link, useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  return (
    <div className="container">
      <h2 className="header">Login</h2>

      <div className="form-box">
        <label>Email</label>
        <input placeholder="Enter email" />

        <label>Password</label>
        <input type="password" placeholder="Enter password" />

        <button onClick={() => navigate("/dashboard")}>
          Login
        </button>

        <div className="bottom-text">
          Don't have an account? <Link to="/">Sign up</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;