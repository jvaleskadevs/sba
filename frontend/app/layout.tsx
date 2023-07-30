"use client";
import { WagmiConfig, createConfig, configureChains } from "wagmi";
import { celo } from "wagmi/chains";
import { publicProvider } from 'wagmi/providers/public';
import { ConnectKitProvider, getDefaultConfig } from "connectkit";
import Navbar from "@/components/homeComponent/navigation/navbar";
import Footer from "@/components/homeComponent/navigation/footer";

const { chains } = configureChains(
  [celo],
  [
    publicProvider(),  
  ]
);

const config = createConfig(
  getDefaultConfig({
    // Required API Keys
    walletConnectProjectId: process.env.NEXT_PUBLIC_WC,
    
    chains: chains,

    // Required
    appName: "Subscription Bound Account dapp",
  })
);

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <WagmiConfig config={config}>
        <ConnectKitProvider mode="dark">
          <body>
            <div style={{ display: "flex", flexDirection: "column", minHeight: "105vh" }}>
              <Navbar />
              <div style={{flexGrow: 1}}>{children}</div>
              <Footer />
            </div>
          </body>
        </ConnectKitProvider>
      </WagmiConfig>
    </html>
  );
}
