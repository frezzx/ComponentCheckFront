import { BrowserRouter as Router } from "react-router-dom";
import { AppRoutes } from "./routes/routes";
import { AuthProvider } from "./auth/AuthContext";
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
      <ToastContainer />
    </Router>
  );
}

export default App;
