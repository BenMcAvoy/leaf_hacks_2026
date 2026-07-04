export function LeafMark({ size }: { size: number }) {
  const leafSize = Math.round(size * 0.52);
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#2b3ed1",
        borderRadius: Math.round(size * 0.22),
      }}
    >
      <div
        style={{
          width: leafSize,
          height: leafSize,
          background: "white",
          borderTopLeftRadius: 0,
          borderTopRightRadius: leafSize,
          borderBottomRightRadius: leafSize,
          borderBottomLeftRadius: leafSize,
          transform: "rotate(-45deg)",
        }}
      />
    </div>
  );
}
