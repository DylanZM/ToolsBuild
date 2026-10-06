import React from "react";

type StarBorderProps<T extends React.ElementType> =
  React.ComponentPropsWithoutRef<T> & {
    as?: T;
    className?: string;
    children?: React.ReactNode;
    color?: string;
    speed?: React.CSSProperties["animationDuration"];
    thickness?: number;
    backgroundColor?: string;
    textColor?: string;
    borderColor?: string;
  };

const StarBorder = <T extends React.ElementType = "button">({
  as,
  className = "",
  color = "#d9a441",
  speed = "6s",
  thickness = 1,
  backgroundColor = "var(--ink, #e8e9e3)",
  textColor = "var(--surface, #07080a)",
  borderColor = "transparent",
  children,
  ...rest
}: StarBorderProps<T>) => {
  const Component = (as || "button") as React.ElementType;

  return (
    <Component
      className={`relative inline-block overflow-hidden rounded-lg ${className}`}
      {...(rest as Record<string, unknown>)}
      style={{
        padding: `${thickness}px 0`,
        ...((rest as { style?: React.CSSProperties }).style ?? {}),
      }}
    >
      <div
        className="absolute bottom-[-11px] right-[-250%] z-0 h-[50%] w-[300%] rounded-full opacity-70 animate-star-movement-bottom"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animationDuration: speed,
        }}
      />
      <div
        className="absolute left-[-250%] top-[-10px] z-0 h-[50%] w-[300%] rounded-full opacity-70 animate-star-movement-top"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animationDuration: speed,
        }}
      />
      <div
        className="relative z-10 rounded-lg px-5 py-2.5 text-center text-[12.5px] font-medium tracking-tight"
        style={{
          background: backgroundColor,
          color: textColor,
          borderColor,
        }}
      >
        {children}
      </div>
    </Component>
  );
};

export default StarBorder;
