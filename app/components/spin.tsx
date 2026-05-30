type SpinProps = {
  s?: number;
};

export default function Spin({ s = 12 }: SpinProps) {
  return (
    <div
      style={{
        width: s,
        height: s,
        borderRadius: "50%",
        border: "2px solid rgba(255,255,255,0.15)",
        borderTopColor: "rgba(255,255,255,0.8)",
        animation: "spin 0.7s linear infinite",
        flexShrink: 0,
      }}
    />
  );
}
