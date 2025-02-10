import "@xyflow/react/dist/style.css";

/** Styles for Controls and Buttons **/
export const controlsContainerStyle = {
  position: "absolute",
  left: 15,
  top: "50%",
  transform: "translateY(-50%)",
  display: "flex",
  flexDirection: "column",
  gap: "5px",
};

export const buttonContainerStyle = {
  position: "absolute",
  bottom: 15,
  left: "50%",
  transform: "translateX(-50%)",
  display: "flex",
  flexWrap: "wrap",
  gap: "10px",
  padding: "10px",
};

export const customButtonStyle = {
  display: "flex",
  alignItems: "center",
  gap: "5px",
  padding: "8px 12px",
  border: "none",
  borderRadius: "5px",
  background: "#007bff",
  color: "white",
  cursor: "pointer",
  fontSize: "14px",
};
