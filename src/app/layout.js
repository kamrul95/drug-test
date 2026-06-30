import "./globals.css";
import Nav from "@/components/Nav";

export const metadata = {
  title: "Drug Result System",
  description: "Drug-test result management",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Nav />
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
