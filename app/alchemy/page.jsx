import AppShell from '../../components/app-shell';
import { getBreadcrumbJsonLd, getToolJsonLd, getToolFaqJsonLd } from '../../lib/seo-breadcrumbs.mjs';

export const dynamic = 'force-static';

export const metadata = {
  title: 'Morrowind Alchemy Calculator & Potion Brewing Recipe Tool',
  description: 'Calculate exact Morrowind potion effects and brew success chances using OpenMW 0.51 engine formulas. Accounts for mortar, alembic, calcinator, and retort.',
  alternates: { canonical: 'https://siltstrider.tools/alchemy' },
  openGraph: {
    title: 'Morrowind Alchemy Calculator & Potion Brewing Recipe Tool | Silt Strider Tools',
    description: 'Calculate exact Morrowind potion effects and brew success chances using OpenMW 0.51 engine formulas. Accounts for mortar, alembic, calcinator, and retort.',
    url: 'https://siltstrider.tools/alchemy',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Silt Strider Tools — Morrowind Alchemy Calculator' }]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Morrowind Alchemy Calculator & Potion Brewing Recipe Tool | Silt Strider Tools',
    description: 'Calculate exact Morrowind potion effects and brew success chances using OpenMW 0.51 engine formulas. Accounts for mortar, alembic, calcinator, and retort.',
    images: ['/og-image.png']
  }
};

export default function AlchemyPage() {
  const key = process.env.CLERK_PUBLISHABLE_KEY || '';
  if (key && !/^pk_(test|live)_[A-Za-z0-9_-]+$/.test(key)) throw new Error('Invalid Clerk publishable key');
  const breadcrumb = getBreadcrumbJsonLd('alchemy');
  const toolJsonLd = getToolJsonLd('alchemy');
  const toolFaqJsonLd = getToolFaqJsonLd('alchemy');
  return <>
    <meta name="clerk-publishable-key" content={key} />
    {breadcrumb && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />}
    {toolJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(toolJsonLd) }} />}
    {toolFaqJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(toolFaqJsonLd) }} />}
    <section className="sr-only" aria-label="Morrowind Alchemy Mechanics &amp; Brewing Guide">
      <h2>Morrowind Alchemy Mechanics &amp; Formula Guide</h2>
      <p>
        The Morrowind Alchemy Calculator works out potions with the brewing rules from the OpenMW 0.51.0 engine source (mwmechanics). Combine up to four ingredients from Morrowind, Tribunal, Bloodmoon, Tamriel Rebuilt 26.08 (Poison Song), and ARCE to calculate potion effects, magnitude, duration, gold value, and brewing success probability.
      </p>
      <h3>Apparatus Roles &amp; Modifiers</h3>
      <p>
        Alchemy requires a Mortar and Pestle at minimum, with three optional apparatus types to refine the brew:
      </p>
      <ul>
        <li><strong>Mortar and Pestle:</strong> Essential apparatus that establishes base potion potency and effect duration. Available in Apprentice (0.5×), Journeyman (1.0×), Master (1.25×), and Grandmaster (1.5×) quality.</li>
        <li><strong>Alembic:</strong> Reduces the magnitude and duration of negative side-effects (harmful effects) in positive potions.</li>
        <li><strong>Calcinator:</strong> Magnifies the magnitude and duration of both positive and negative effects, increasing overall potion potency.</li>
        <li><strong>Retort:</strong> Magnifies the magnitude and duration of positive effects, boosting the beneficial properties of the brew.</li>
      </ul>
      <h3>Brewing Success Probability Formula</h3>
      <p>
        In OpenMW and Morrowind, potion brewing success chance is calculated using the formula:
        ⌊Alchemy Skill + 0.1 × Intelligence + 0.1 × Luck⌋%.
        Unlike spellcasting or physical combat, fatigue does not modify the brewing chance in engine mechanics. Potion magnitude and duration scale formulaically with character Alchemy skill and Mortar quality.
      </p>
    </section>
    <AppShell initialView="alchemy" />
  </>;
}
