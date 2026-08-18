import hero from "../assets/hero.png";

<img src={hero} />
export default function Hero() {
  return (
    <section className="hero">

      <div className="left">

        <h1>
          AI Powered <br />
          Medicine Verification
        </h1>

        <p>
          Scan QR codes and verify medicine authenticity instantly.
        </p>

        <button className="hero-btn">
          Verify Medicine
        </button>

      </div>

      <div className="right">
        <img src={hero} alt="Medicine" />
      </div>

    </section>
  );
}