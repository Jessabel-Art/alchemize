// Destinations for the /links link-in-bio hub. Any `href` left as null is an
// unconfirmed destination: the artwork still renders so the composition
// matches the approved mockup, but it is not a link until a real URL is set.
export const IMAGE_DIR = "/assets/images/link-bio/web";

export const linkHubButtons = [
  {
    id: "getalchemize",
    label: "GetAlchemize.com",
    description: "Consulting agency site",
    href: "https://getalchemize.com/",
    image: `${IMAGE_DIR}/links-btn-getalchemize`,
    // Intrinsic size of the trimmed artwork (1000w export).
    width: 1000,
    height: 205,
  },
  {
    id: "jessabel",
    label: "Jessabel.Art",
    description: "Portfolio site",
    href: "https://jessabel.art/",
    image: `${IMAGE_DIR}/links-btn-jessabel`,
    width: 1000,
    height: 200,
  },
  {
    id: "etsy",
    label: "Santos Customs & Care",
    description: "Etsy shop",
    href: "https://www.etsy.com/shop/SantosCustomsCare",
    image: `${IMAGE_DIR}/links-btn-etsy`,
    width: 1000,
    height: 200,
  },
  {
    id: "instagram",
    label: "@GetAlchemize",
    description: "Business Instagram",
    href: "https://www.instagram.com/getalchemize/",
    image: `${IMAGE_DIR}/links-btn-instagram`,
    width: 1000,
    height: 196,
  },
  {
    id: "pinkladyz",
    label: "@PinkLadyJessZ",
    description: "Car hobby Instagram",
    href: "https://www.instagram.com/pinkladyjessz/",
    image: `${IMAGE_DIR}/links-btn-pinkladyz`,
    width: 1000,
    height: 195,
  },
];

export const linkHubSocials = [
  {
    id: "instagram",
    label: "@jessieleonne on Instagram",
    href: "https://www.instagram.com/jessieleonne/",
    image: `${IMAGE_DIR}/links-social-instagram-160.webp`,
  },
  {
    id: "facebook",
    label: "Alchemize on Facebook",
    href: "https://www.facebook.com/getalchemizefb",
    image: `${IMAGE_DIR}/links-social-facebook-160.webp`,
  },
  {
    id: "threads",
    label: "Alchemize on Threads",
    href: "https://www.threads.com/@getalchemize",
    image: `${IMAGE_DIR}/links-social-threads-160.webp`,
  },
  {
    id: "linkedin",
    label: "Alchemize on LinkedIn",
    href: "https://www.linkedin.com/company/getalchemize/",
    image: `${IMAGE_DIR}/links-social-linkedin-160.webp`,
  },
];
