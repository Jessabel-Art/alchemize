function Logo({
  surface = "dark",
  className = "",
  responsive = false,
  decorative = false,
}) {
  const colorway = surface === "light" ? "dark" : "light";
  const image = (
    <img
      className={`brand-logo ${className}`.trim()}
      src={`/assets/logos/alchemize-logo-${colorway}.png`}
      alt={decorative ? "" : "Alchemize Business Services"}
    />
  );

  if (!responsive) return image;

  return (
    <picture className="brand-logo-picture">
      <source
        media="(max-width: 380px)"
        srcSet={`/assets/logos/alchemize-emblem-${colorway}.png`}
      />
      {image}
    </picture>
  );
}

export default Logo;
