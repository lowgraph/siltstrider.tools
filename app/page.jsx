import LegacyWorkbench from '../components/legacy-workbench';
import body from '../migration/generated/body.json';
import manifest from '../migration/generated/manifest.json';
export const dynamic = 'force-static';
export default function Page() {
  const key = process.env.CLERK_PUBLISHABLE_KEY || '';
  if (key && !/^pk_(test|live)_[A-Za-z0-9_-]+$/.test(key)) throw new Error('Invalid Clerk publishable key');
  return <>
    <meta name="clerk-publishable-key" content={key} />
    <link rel="stylesheet" href={'/legacy/legacy.css?v='+manifest.revision} />
    <LegacyWorkbench html={body} revision={manifest.revision} />
  </>;
}
