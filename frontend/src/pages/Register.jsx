import { Link, useNavigate } from "react-router-dom";

function Register() {
  const navigate = useNavigate();

  return (
    <div className="container">
      <h2 className="header">Register</h2>

      <div className="form-box">
        <label>Name</label>
        <input placeholder="Enter your name" />

        <label>Username</label>
        <input placeholder="Enter username" />

        <label>Email</label>
        <input placeholder="Enter email" />

        <label>Password</label>
        <input type="password" placeholder="Enter password" />

        <label>Confirm Password</label>
        <input type="password" placeholder="Confirm password" />

        <button onClick={() => navigate("/dashboard")}>
          Sign up
        </button>

        <div className="bottom-text">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}

export default Register;