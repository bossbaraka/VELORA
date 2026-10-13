import { Home } from "@/components/home";
import { HERO_IMAGES } from "@/data/images";
export default function Page() {
  return (
    <>
      <link
        rel="preload"
        as="image"
        href={HERO_IMAGES.mobile}
        media="(max-width: 700px)"
        fetchPriority="high"
      />
      <link
        rel="preload"
        as="image"
        href={HERO_IMAGES.desktop}
        media="(min-width: 701px)"
        fetchPriority="high"
      />
      <Home />
    </>
  );
}
