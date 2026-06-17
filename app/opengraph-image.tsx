import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "CryptoTwin AI live market DNA dashboard";
export const size = {
  width: 1200,
  height: 630
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#101815",
          color: "#eef7ef",
          fontFamily: "Arial, sans-serif",
          padding: 72
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            border: "2px solid #38564a",
            borderRadius: 40,
            padding: 56,
            background: "#17221e"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <div
              style={{
                width: 88,
                height: 88,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 24,
                background: "#8df0b7",
                color: "#101815",
                fontSize: 54,
                fontWeight: 900
              }}
            >
              T
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ color: "#9cf7c1", fontSize: 28, fontWeight: 700 }}>
                CryptoTwin AI
              </span>
              <span style={{ color: "#a9b9ae", fontSize: 22 }}>
                Live CMC data - market DNA engine
              </span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <h1
              style={{
                maxWidth: 820,
                margin: 0,
                fontSize: 86,
                lineHeight: 0.98,
                letterSpacing: 0
              }}
            >
              Find the coin moving like this.
            </h1>
            <p
              style={{
                maxWidth: 820,
                margin: 0,
                color: "#c6d4c9",
                fontSize: 30,
                lineHeight: 1.35
              }}
            >
              Compare live crypto market DNA, inspect the closest analogues, and
              turn matches into research rails.
            </p>
          </div>

          <div style={{ display: "flex", gap: 18 }}>
            {["Similarity", "Confidence", "Risk rails"].map((item) => (
              <span
                key={item}
                style={{
                  border: "1px solid #38564a",
                  borderRadius: 999,
                  color: "#9cf7c1",
                  fontSize: 24,
                  fontWeight: 700,
                  padding: "12px 22px"
                }}
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    ),
    size
  );
}
