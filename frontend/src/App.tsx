import React, { useState, Component } from "react";
import LandingPage from "./pages/LandingPage";
import ChatPage from "./pages/ChatPage";

interface Session {
  isAuthenticated: boolean;
  username?: string;
}

function readSession(): Session {
  try {
    const raw = localStorage.getItem("globalchat_session");
    if (!raw) return { isAuthenticated: false };
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === "object" &&
      parsed.isAuthenticated === true &&
      typeof parsed.username === "string" &&
      parsed.username.length > 0
    ) {
      return { isAuthenticated: true, username: parsed.username };
    }
    return { isAuthenticated: false };
  } catch {
    return { isAuthenticated: false };
  }
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: string;
}

class ErrorBoundary extends Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: "" };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error: error?.message || String(error) };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("App render error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            background: "#1e1f22",
            color: "#dcddde",
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "Inter, sans-serif",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>⚠️</div>
          <h2 style={{ color: "#ed4245", marginBottom: "0.5rem" }}>
            Something went wrong
          </h2>
          <p style={{ color: "#b9bbbe", marginBottom: "1.5rem", maxWidth: 400 }}>
            {this.state.error}
          </p>
          <button
            onClick={() => {
              try {
                localStorage.removeItem("globalchat_session");
              } catch {
                // ignore
              }
              window.location.reload();
            }}
            style={{
              background: "#5865f2",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              padding: "0.6rem 1.4rem",
              cursor: "pointer",
              fontSize: "0.95rem",
            }}
          >
            Reload App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  // Synchronously read session on first render — no loading state needed
  const [session, setSession] = useState<Session>(readSession);

  const handleJoin = (username: string) => {
    const newSession: Session = { isAuthenticated: true, username };
    try {
      localStorage.setItem(
        "globalchat_session",
        JSON.stringify({ isAuthenticated: true, username })
      );
    } catch {
      // ignore storage errors
    }
    setSession(newSession);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem("globalchat_session");
    } catch {
      // ignore storage errors
    }
    setSession({ isAuthenticated: false });
  };

  if (session.isAuthenticated && session.username) {
    return (
      <ErrorBoundary>
        <ChatPage username={session.username} onLogout={handleLogout} />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <LandingPage onJoin={handleJoin} />
    </ErrorBoundary>
  );
}
