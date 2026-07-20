import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

// Root HTML shell for the static web export - the one place <title> and social
// meta live (expo-router static export ignores route titles for the document).
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <title>Covenant Odyssey - Divergent Prophecies</title>
        <meta
          name="description"
          content="The kingdoms fracture. You are Eliab, and how you walk the path of fire and flesh is yours to decide. An interactive branching narrative."
        />
        <meta property="og:title" content="Covenant Odyssey - Divergent Prophecies" />
        <meta
          property="og:description"
          content="The kingdoms fracture. Blood will stain the throne before the anointed rises. Your choices write the prophecy."
        />
        <meta property="og:image" content="/Covenant-Odyssey-Divergent-Prophecies-og.jpg" />
        <meta property="og:type" content="website" />
        <ScrollViewStyleReset />
      </head>
      <body style={{ backgroundColor: '#0A0A0C' }}>{children}</body>
    </html>
  );
}
