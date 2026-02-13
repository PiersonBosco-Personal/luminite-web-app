import React from "react";

const spinnerStyle: React.CSSProperties = {
  display: "inline-block",
  width: "48px",
  height: "48px",
  border: "4px solid #f3f3f3",
  borderTop: "4px solid #93A546",
  borderRadius: "50%",
  animation: "spin 1s linear infinite",
};

const spinnerContainer: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: "100%",
  minHeight: "80px",
};

const styleSheet = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;

const CssSpinner: React.FC = () => (
  <div style={spinnerContainer}>
    <style>{styleSheet}</style>
    <div style={spinnerStyle} />
  </div>
);

export default CssSpinner;
