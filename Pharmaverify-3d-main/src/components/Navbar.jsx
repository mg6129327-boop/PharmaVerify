export default function Navbar() {
  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
    });
  };

  const goHome = () => {
    window.location.reload();
  };

  return (
    <nav className="navbar">
      <h2
        onClick={goHome}
        style={{ cursor: "pointer" }}
      >
        PharmaVerify
      </h2>

      <div className="nav-links">
        <button onClick={goHome}>
          Home
        </button>

        <button onClick={() => scrollToSection("features")}>
          Features
        </button>

        <button onClick={() => scrollToSection("how-it-works")}>
          How it Works
        </button>

        <button onClick={() => scrollToSection("scanner")}>
          Scanner
        </button>

        <button onClick={() => scrollToSection("scanner")}>
          Scan Now
        </button>
      </div>
    </nav>
  );
}