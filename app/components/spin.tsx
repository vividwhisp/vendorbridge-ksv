type SpinProps = {
  s?: number;
};

export default function Spin({ s = 12 }: SpinProps) {
  return (
    <div
      className="rounded-full animate-spin flex-shrink-0"
      style={{
        width: s,
        height: s,
        border: "2px solid rgba(255,255,255,0.1)",
        borderTopColor: "rgba(255,255,255,0.7)",
      }}
    />
  );
}
