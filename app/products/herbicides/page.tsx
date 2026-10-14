import { permanentRedirect } from "next/navigation";

// Legacy category URL — the business no longer sells these goods; the
// non-chemical crop-care range lives under /c/traps-and-repellents.
export default function LegacyCategoryPage() {
  permanentRedirect("/c/traps-and-repellents");
}
