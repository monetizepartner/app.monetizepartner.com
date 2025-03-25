// App.js
import React, { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = "https://app-monetizepartner-com.onrender.com";

function App() {
  const [userType, setUserType] = useState(null);
  const [token, setToken] = useState("");
  const [publisherId, setPublisherId] = useState("");
  const [excelFile, setExcelFile] = useState(null);
  const [reportData, setReportData] = useState([]);
  const [loginInfo, setLoginInfo] = useState({ username: "", password: "" });
  const [showRegister, setShowRegister] = useState(false);
  const [registerInfo, setRegisterInfo] = useState({ username: "", password: "" });

  const handleLogin = async () => {
    try {
      const res = await axios.post(`${API_BASE}/api/login`, loginInfo);
      setToken(res.data.token);
      setUserType(res.data.role);
      if (res.data.role === "publisher") setPublisherId(loginInfo.username);
    } catch (err) {
      alert("Login failed");
    }
  };

  const handleRegister = async () => {
    try {
      await axios.post(`${API_BASE}/api/register`, registerInfo);
      alert("Registration successful. Please login.");
      setShowRegister(false);
      setLoginInfo(registerInfo);
    } catch (err) {
      if (err.response && err.response.status === 409) {
        alert("Username already exists");
      } else {
        alert("Registration failed");
      }
    }
  };

  const handleFileChange = (e) => {
    setExcelFile(e.target.files[0]);
  };

  const uploadExcel = async () => {
    if (!excelFile) return;
    const formData = new FormData();
    formData.append("file", excelFile);

    try {
      await axios.post(`${API_BASE}/api/upload`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("File uploaded and processed successfully.");
      fetchReports();
    } catch (err) {
      alert("Upload failed");
    }
  };

  const fetchReports = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/reports`, {
        headers: { Authorization: `Bearer ${token}` },
        params: userType === "publisher" ? { publisher_id: publisherId } : {},
      });
      setReportData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (token) fetchReports();
  }, [token]);

  if (!userType) {
    return (
      <div style={{ padding: 20 }}>
        {!showRegister ? (
          <>
            <h2>🔐 Login</h2>
            <input
              type="text"
              placeholder="Username"
              value={loginInfo.username}
              onChange={(e) => setLoginInfo({ ...loginInfo, username: e.target.value })}
            />
            <br />
            <input
              type="password"
              placeholder="Password"
              value={loginInfo.password}
              onChange={(e) => setLoginInfo({ ...loginInfo, password: e.target.value })}
            />
            <br />
            <button onClick={handleLogin}>Login</button>
            <p>
              Don't have an account? {" "}
              <button onClick={() => setShowRegister(true)}>Register</button>
            </p>
          </>
        ) : (
          <>
            <h2>📝 Register as Publisher</h2>
            <input
              type="text"
              placeholder="Username"
              value={registerInfo.username}
              onChange={(e) => setRegisterInfo({ ...registerInfo, username: e.target.value })}
            />
            <br />
            <input
              type="password"
              placeholder="Password"
              value={registerInfo.password}
              onChange={(e) => setRegisterInfo({ ...registerInfo, password: e.target.value })}
            />
            <br />
            <button onClick={handleRegister}>Register</button>
            <p>
              Already have an account? {" "}
              <button onClick={() => setShowRegister(false)}>Login</button>
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>{userType === "admin" ? "📁 Admin Panel" : "📊 Publisher Dashboard"}</h2>

      {userType === "admin" && (
        <div>
          <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} />
          <button onClick={uploadExcel}>Upload Excel</button>
        </div>
      )}

      <h3>📄 Report Table</h3>
      <table border="1" cellPadding="5">
        <thead>
          <tr>
            {reportData[0] &&
              Object.keys(reportData[0]).map((key) => <th key={key}>{key}</th>)}
          </tr>
        </thead>
        <tbody>
          {reportData.map((row, i) => (
            <tr key={i}>
              {Object.values(row).map((val, j) => (
                <td key={j}>{val}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
