import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CubeTime — speedcubing timer",
  description:
    "Fast, keyboard-friendly speedcubing timer. Your solves stay in this browser.",
};

// Applies the stored theme before first paint so the page never flashes the wrong theme.
const themeInit = `try{var t=localStorage.getItem("cubetime-theme");if(t==="light"){document.documentElement.classList.remove("dark");}else if(t==="system"&&window.matchMedia("(prefers-color-scheme: light)").matches){document.documentElement.classList.remove("dark");}else{document.documentElement.classList.add("dark");}}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        {children}
      </body>
    </html>
  );
}
