import { useEffect } from "react";
import { ensureMeta, SITE_URL } from "../../seo/siteSchema.js";
import { jessyLinks } from "./jessyLinks.js";
import "./jessy-link-bio.css";

const PAGE_TITLE = "Alchemize × Jessabel.art | Jessy";
const PAGE_DESCRIPTION =
  "Connect with Alchemize, Jessabel.art, Alchemize Agency, and PinkLadyZ.";

function LinkCard({ id, link, imageSrc }) {
  const ariaLabel = `${link.label} — ${link.description}`;
  return (
    <a
      href={link.href}
      className={`jessy-card jessy-card-${id}`}
      aria-label={ariaLabel}
      {...(link.external
        ? { target: "_blank", rel: "noopener noreferrer" }
        : {})}
    >
      <img src={imageSrc} alt="" />
    </a>
  );
}

function JessyLinkBioPage() {
  useEffect(() => {
    document.title = PAGE_TITLE;
    ensureMeta('meta[name="description"]', {
      name: "description",
      content: PAGE_DESCRIPTION,
    });

    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.append(canonical);
    }
    canonical.href = `${SITE_URL}/jessy`;
  }, []);

  return (
    <div className="jessy-page">
      <div className="jessy-poster">
        <h1 className="jessy-sr-only">ALCHEMIZE × JESSABEL.ART</h1>
        <p className="jessy-sr-only">YOUR TECH-SAVVY BUSINESS PARTNER.</p>

        <img
          className="jessy-title-card"
          src="/assets/images/link-bio/link-bio-title.webp"
          alt=""
          aria-hidden="true"
        />

        <LinkCard
          id="getalchemize"
          link={jessyLinks.getalchemize}
          imageSrc="/assets/images/link-bio/link-bio-getalchemize.webp"
        />
        <LinkCard
          id="jessabel"
          link={jessyLinks.jessabelArt}
          imageSrc="/assets/images/link-bio/link-bio-jessabel.webp"
        />
        <LinkCard
          id="agency"
          link={jessyLinks.alchemizeAgency}
          imageSrc="/assets/images/link-bio/link-bio-alchemize-agency.webp"
        />
        <LinkCard
          id="pinkladyz"
          link={jessyLinks.pinkladyz}
          imageSrc="/assets/images/link-bio/link-bio-pinkladyz.webp"
        />
      </div>
    </div>
  );
}

export default JessyLinkBioPage;
