import { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer
} from "recharts";

const BASE_URL = "https://job-tracker-backend-ntvx.onrender.com";

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [jobs, setJobs] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");

  const COLORS = ["#3498db", "#f39c12", "#2ecc71", "#e74c3c"];

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true);
      fetchJobs(token);
    }
  }, []);

  const validateInputs = () => {
    if (!email.endsWith("@gmail.com")) {
      alert("Email must end with @gmail.com");
      return false;
    }

    const strongPasswordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{6,}$/;

    if (!strongPasswordRegex.test(password)) {
      alert(
        "Password must be at least 6 characters and include uppercase, lowercase, number and special character"
      );
      return false;
    }

    return true;
  };

  const handleAuth = async () => {
    if (!validateInputs()) return;

    try {
      if (isRegistering) {
        await axios.post(`${BASE_URL}/auth/register`, {
          name,
          email,
          password
        });

        alert("Registration successful! Please login.");
        setIsRegistering(false);
        return;
      }

      const res = await axios.post(`${BASE_URL}/auth/login`, {
        email,
        password
      });

      localStorage.setItem("token", res.data.token);
      setIsLoggedIn(true);
      fetchJobs(res.data.token);

    } catch (error) {
      alert(error.response?.data?.message || "Something went wrong");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    setJobs([]);
  };

  const fetchJobs = async (token) => {
    setLoading(true);
    const res = await axios.get(`${BASE_URL}/jobs`, {
      headers: { Authorization: token }
    });
    setJobs(res.data);
    setLoading(false);
  };

  const handleAddJob = async () => {
    const token = localStorage.getItem("token");
    if (!company || !role) return;

    await axios.post(
      `${BASE_URL}/jobs/add`,
      { company, role },
      { headers: { Authorization: token } }
    );

    setCompany("");
    setRole("");
    fetchJobs(token);
  };

  const handleDeleteJob = async (id) => {
    const token = localStorage.getItem("token");
    await axios.delete(
      `${BASE_URL}/jobs/${id}`,
      { headers: { Authorization: token } }
    );
    fetchJobs(token);
  };

  const handleStatusChange = async (id, newStatus) => {
    const token = localStorage.getItem("token");
    await axios.put(
      `${BASE_URL}/jobs/${id}`,
      { status: newStatus },
      { headers: { Authorization: token } }
    );
    fetchJobs(token);
  };

  const chartData = [
    { name: "Applied", value: jobs.filter(j => j.status === "Applied").length },
    { name: "Interview", value: jobs.filter(j => j.status === "Interview").length },
    { name: "Selected", value: jobs.filter(j => j.status === "Selected").length },
    { name: "Rejected", value: jobs.filter(j => j.status === "Rejected").length }
  ];

  if (!isLoggedIn) {
    return (
      <div style={styles.loginContainer}>
        <div style={styles.card}>
          <h2>{isRegistering ? "Sign Up" : "Login"}</h2>

          {isRegistering && (
            <input
              style={styles.input}
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}

          <input
            style={styles.input}
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div style={{ position: "relative" }}>
            <input
              style={styles.input}
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={styles.showBtn}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          <button style={styles.primaryBtn} onClick={handleAuth}>
            {isRegistering ? "Register" : "Login"}
          </button>

          <p
            style={{ marginTop: "10px", cursor: "pointer", color: "#3498db" }}
            onClick={() => setIsRegistering(!isRegistering)}
          >
            {isRegistering
              ? "Already have an account? Login"
              : "Don't have an account? Sign Up"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.background}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h2>My Job Dashboard</h2>
          <button style={styles.logoutBtn} onClick={handleLogout}>
            Logout
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          style={styles.chartWrapper}
        >
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={chartData} dataKey="value" outerRadius={100} label>
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        <div style={styles.card}>
          <h3>Add Job</h3>
          <input
            style={styles.input}
            placeholder="Company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
          <input
            style={styles.input}
            placeholder="Role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          />
          <button style={styles.primaryBtn} onClick={handleAddJob}>
            Add Job
          </button>
        </div>

        {loading ? (
          <p>Loading jobs...</p>
        ) : (
          jobs.map((job) => (
            <motion.div
              key={job._id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              style={styles.jobCard}
            >
              <h3>{job.company}</h3>
              <p>{job.role}</p>

              <select
                style={styles.input}
                value={job.status}
                onChange={(e) =>
                  handleStatusChange(job._id, e.target.value)
                }
              >
                <option>Applied</option>
                <option>Interview</option>
                <option>Rejected</option>
                <option>Selected</option>
              </select>

              <button
                style={styles.deleteBtn}
                onClick={() => handleDeleteJob(job._id)}
              >
                Delete
              </button>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

const styles = {
  background: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #eef2f3, #dfe9f3)",
    padding: "40px 0"
  },
  container: {
    maxWidth: "900px",
    margin: "0 auto",
    fontFamily: "Arial"
  },
  loginContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px"
  },
  chartWrapper: {
    background: "#fff",
    padding: "20px",
    borderRadius: "10px",
    marginBottom: "20px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)"
  },
  card: {
    background: "#fff",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)"
  },
  jobCard: {
    background: "#fff",
    padding: "20px",
    marginBottom: "15px",
    borderRadius: "10px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)"
  },
  input: {
    width: "100%",
    padding: "10px",
    marginBottom: "10px",
    borderRadius: "5px",
    border: "1px solid #ccc"
  },
  showBtn: {
    position: "absolute",
    right: "10px",
    top: "8px",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    color: "#3498db",
    fontWeight: "bold"
  },
  primaryBtn: {
    background: "#3498db",
    color: "#fff",
    padding: "10px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    width: "100%"
  },
  deleteBtn: {
    background: "#e74c3c",
    color: "#fff",
    padding: "8px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer"
  },
  logoutBtn: {
    background: "#333",
    color: "#fff",
    padding: "8px 15px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer"
  }
};

export default App;