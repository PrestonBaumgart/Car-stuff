import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vinsight · My garage",
  description: "Track service, specs, recalls and common problems for every car you own, by VIN.",
};

// The landing page lives one level up on GitHub Pages (/Car-stuff/), outside this app's basePath.
const LANDING = process.env.NEXT_PUBLIC_BASE_PATH ? `${process.env.NEXT_PUBLIC_BASE_PATH}/../` : "/";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@800;900&family=Chakra+Petch:wght@400;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap"
        />
      </head>
      <body>
        <header className="top">
          <div className="wrap">
            <Link className="brand" href="/">
              <i />
              Vinsight
            </Link>
            <nav>
              <Link href="/">My garage</Link>
              <a href={LANDING}>About</a>
            </nav>
          </div>
        </header>
        <main className="wrap">{children}</main>
      </body>
    </html>
  );
}
