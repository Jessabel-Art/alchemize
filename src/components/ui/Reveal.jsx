import useReveal from "../../hooks/useReveal.js";
import "./reveal.css";

function Reveal({
  as: Tag = "div",
  className = "",
  delay = 0,
  children,
  ...props
}) {
  const ref = useReveal();
  return (
    <Tag
      ref={ref}
      className={`reveal ${className}`.trim()}
      style={{ "--reveal-delay": `${delay}ms` }}
      {...props}
    >
      {children}
    </Tag>
  );
}

export default Reveal;
