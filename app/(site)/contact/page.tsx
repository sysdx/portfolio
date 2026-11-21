import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { site } from "@/content/site";

export const metadata: Metadata = { title: "Contact", description: "Get in touch about collaborations, competitions or research." };

export default function Contact() {
  return (
    <div className="site-wrap" style={{ paddingBottom: 96 }}>
      <header className="page-title">
        <h1>Contact</h1>
        <p>For collaborations, team-ups for competitions, or questions about a project.</p>
      </header>
      <div className="detail">
        <ContactForm />
        <aside>
          <dl style={{ margin: 0, display: "grid", gap: 18 }}>
            <div><dt>GitHub</dt><dd><a href={site.links.github}>{site.handle}</a></dd></div>
            {site.links.email && <div><dt>Email</dt><dd><a href={`mailto:${site.links.email}`}>{site.links.email}</a></dd></div>}
          </dl>
        </aside>
      </div>
    </div>
  );
}
