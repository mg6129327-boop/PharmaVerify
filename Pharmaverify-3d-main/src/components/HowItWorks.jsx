const steps = [
  {
    no: "01",
    title: "Scan Medicine",
    text: "Scan QR code or enter Batch Number."
  },
  {
    no: "02",
    title: "AI Analysis",
    text: "AI verifies manufacturer and batch details."
  },
  {
    no: "03",
    title: "Database Match",
    text: "Cross-check with verified records."
  },
  {
    no: "04",
    title: "Verification Result",
    text: "Get Genuine, Warning or Suspicious result."
  }
];

export default function HowItWorks() {
  return (
    <section className="how" id="how-it-works">

      <h2>How It Works</h2>

      <div className="timeline">

        {steps.map((step, index) => (
          <div className="card" key={index}>

            <span>{step.no}</span>

            <h3>{step.title}</h3>

            <p>{step.text}</p>

          </div>
        ))}

      </div>

    </section>
  );
}