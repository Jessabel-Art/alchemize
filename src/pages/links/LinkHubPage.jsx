import usePageMetadata from "../../i18n/usePageMetadata.js";
import { IMAGE_DIR, linkHubButtons, linkHubSocials } from "./linkHubConfig.js";
import "./link-hub.css";

const BUTTON_SIZES = "(min-width: 600px) 480px, 86vw";

const metadata = {
  en: {
    title: "Alchemize × Jessabel.Art | Links",
    description:
      "Links for Alchemize Business Services and Jessabel.Art: the consulting agency site, portfolio, Etsy shop, and Instagram accounts.",
  },
};

const NEW_TAB_NOTE = " (opens in a new tab)";

function buttonSrcSet(base) {
  return `${base}-600.webp 600w, ${base}-1000.webp 1000w`;
}

function LinkButton({ button }) {
  const { width, height } = button;
  const label = `${button.label}, ${button.description}`;

  const layers = (
    <>
      <img
        className="links-btn__gold"
        src={`${IMAGE_DIR}/links-btn-gold-600.webp`}
        srcSet={buttonSrcSet(`${IMAGE_DIR}/links-btn-gold`)}
        sizes={BUTTON_SIZES}
        width={width}
        height={height}
        alt=""
        aria-hidden="true"
      />
      <img
        className="links-btn__face"
        src={`${button.image}-600.webp`}
        srcSet={buttonSrcSet(button.image)}
        sizes={BUTTON_SIZES}
        width={width}
        height={height}
        alt=""
        aria-hidden="true"
      />
    </>
  );

  if (!button.href) {
    return (
      <li>
        <div
          className={`links-btn links-btn--pending links-btn--${button.id}`}
          role="img"
          aria-label={`${label} (link coming soon)`}
        >
          {layers}
        </div>
      </li>
    );
  }

  return (
    <li>
      <a
        className={`links-btn links-btn--${button.id}`}
        href={button.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label + NEW_TAB_NOTE}
      >
        {layers}
      </a>
    </li>
  );
}

function SocialIcon({ social }) {
  const image = (
    <img
      src={social.image}
      width="160"
      height="160"
      alt=""
      aria-hidden="true"
      loading="lazy"
      decoding="async"
    />
  );

  if (!social.href) {
    return (
      <li className="links-social__item links-social__item--pending">
        <span className="links-social__icon">{image}</span>
      </li>
    );
  }

  return (
    <li className="links-social__item">
      <a
        className="links-social__icon"
        href={social.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={social.label + NEW_TAB_NOTE}
      >
        {image}
      </a>
    </li>
  );
}

function LinkHubPage() {
  usePageMetadata(metadata);

  return (
    <div className="links-page">
      <main className="links-stage">
        <h1 className="links-title">
          <img
            src={`${IMAGE_DIR}/links-title-700.webp`}
            srcSet={`${IMAGE_DIR}/links-title-700.webp 700w, ${IMAGE_DIR}/links-title-1200.webp 1200w`}
            sizes="(min-width: 600px) 605px, 108vw"
            width="1200"
            height="512"
            alt="Alchemize Business Services × Jessabel.Art"
            fetchPriority="high"
          />
        </h1>

        <ul className="links-list">
          {linkHubButtons.map((button) => (
            <LinkButton key={button.id} button={button} />
          ))}
        </ul>

        <nav className="links-social" aria-label="Social media">
          <span className="links-social__divider" aria-hidden="true" />
          <ul className="links-social__list">
            {linkHubSocials.map((social) => (
              <SocialIcon key={social.id} social={social} />
            ))}
          </ul>
        </nav>
      </main>
    </div>
  );
}

export default LinkHubPage;
