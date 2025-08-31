import { Html, Head, Main, NextScript } from 'next/document'
export default function Document() {
  return (
    <Html lang="pt-BR">
      <Head>
        <meta name="theme-color" content="#16A34A" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/logo.png" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </Head>
      <body className="bg-neutral-50 text-neutral-900">
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
