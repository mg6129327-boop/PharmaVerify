import { useState, useEffect } from "react";
import History from "./components/History";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Features from "./components/Features";
import HowItWorks from "./components/HowItWorks";
import Scanner from "./components/Scanner";
import Result from "./pages/Result";
import Footer from "./components/Footer";

const API_URL = import.meta.env.VITE_API_URL;

function App() {
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  const fetchHistory = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/medicine/history`
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setHistory(data.history);
      }
    } catch (error) {
      console.error("History fetch error:", error);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="app">
      <Navbar />

      <Hero />

      <Features />

      <HowItWorks />

      <Scanner
        setResult={setResult}
        refreshHistory={fetchHistory}
      />

      <Result result={result} />

      <History
        history={history}
        refreshHistory={fetchHistory}
      />

      <Footer />
    </div>
  );
}

export default App;