"use client";

import {
  useMiniKit,
  useAddFrame,
  useOpenUrl,
} from "@coinbase/onchainkit/minikit";
import {
  Name,
  Identity,
  Address,
  Avatar,
  EthBalance,
} from "@coinbase/onchainkit/identity";
import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownDisconnect,
} from "@coinbase/onchainkit/wallet";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Button } from "./components/DemoComponents";
import { Icon } from "./components/DemoComponents";
import { PhotoCropperCard } from "./components/PhotoCropperCard";

export default function App() {
  const { setFrameReady, isFrameReady, context } = useMiniKit();
  const [frameAdded, setFrameAdded] = useState(false);
  const [isDesktopFallback, setIsDesktopFallback] = useState(false);

  const addFrame = useAddFrame();
  const openUrl = useOpenUrl();
  
  // Fallback wallet connection for desktop environments
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  // Debug MiniKit initialization and detect fallback need
  useEffect(() => {
    const shouldUseFallback = !context || !isFrameReady || (typeof window !== 'undefined' && 
      !window.navigator.userAgent.includes('Mobile') && 
      !window.navigator.userAgent.includes('Android') && 
      !window.navigator.userAgent.includes('iPhone'));
    
    console.log('MiniKit Debug:', {
      isFrameReady,
      shouldUseFallback,
      context: context ? {
        client: context.client,
        user: context.user,
        environment: typeof window !== 'undefined' ? {
          userAgent: window.navigator.userAgent,
          isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(window.navigator.userAgent),
          isDesktopFarcaster: window.navigator.userAgent.includes('Farcaster')
        } : null
      } : null
    });
    
    setIsDesktopFallback(shouldUseFallback);
  }, [isFrameReady, context]);

  const handleAddFrame = useCallback(async () => {
    const frameAdded = await addFrame();
    setFrameAdded(Boolean(frameAdded));
  }, [addFrame]);

  const saveFrameButton = useMemo(() => {
    if (context && !context.client.added) {
      return (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleAddFrame}
          className="text-[var(--app-accent)] p-4"
          icon={<Icon name="plus" size="sm" />}
        >
          Add Kroppit
        </Button>
      );
    }

    if (frameAdded) {
      return (
        <div className="flex items-center space-x-1 text-sm font-medium text-[var(--app-accent)] animate-fade-out">
          <Icon name="check" size="sm" className="text-[var(--app-accent)]" />
          <span>Added!</span>
        </div>
      );
    }

    return null;
  }, [context, frameAdded, handleAddFrame]);

  return (
    <div className="flex flex-col min-h-screen font-sans text-[var(--app-foreground)] mini-app-theme from-[var(--app-background)] to-[var(--app-gray)]">
      <div className="w-full max-w-md mx-auto px-4 py-3 min-h-screen">
        <header className="flex justify-between items-center mb-6 h-11">
          <div>
            <div className="flex items-center space-x-2">
              {isDesktopFallback ? (
                // Fallback wallet for desktop environments
                <div className="z-10">
                  {isConnected ? (
                    <div className="flex items-center space-x-2">
                      <div className="text-sm">
                        {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connected'}
                      </div>
                      <Button
                        onClick={() => disconnect()}
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                      >
                        Disconnect
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => connect({ connector: connectors[0] })}
                      variant="ghost"
                      size="sm"
                      disabled={isPending}
                    >
                      {isPending ? 'Connecting...' : 'Connect Wallet'}
                    </Button>
                  )}
                </div>
              ) : (
                // MiniKit wallet for mobile/frame environments
                <Wallet className="z-10">
                  <ConnectWallet>
                    <Name className="text-inherit" />
                  </ConnectWallet>
                  <WalletDropdown>
                    <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
                      <Avatar />
                      <Name />
                      <Address />
                      <EthBalance />
                    </Identity>
                    <WalletDropdownDisconnect />
                  </WalletDropdown>
                </Wallet>
              )}
            </div>
          </div>
          <div>{saveFrameButton}</div>
        </header>

        {/* App Title */}
        <div className="text-center mb-6">
          <picture className="mx-auto mb-6 block">
            <source srcSet="/logo-header-dark.png" media="(prefers-color-scheme: dark)" />
            <img 
              src="/logo-header.png" 
              alt="Kroppit" 
              className="h-16 w-auto"
            />
          </picture>
          {context && (
            <p className="text-xs text-[var(--app-foreground-muted)] mt-1">
              Welcome, {context.user?.displayName || 'User'}! 👋
            </p>
          )}
        </div>

        <main className="flex-1">
          <PhotoCropperCard />
        </main>

        <footer className="mt-6 pt-4 flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            className="text-[var(--ock-text-foreground-muted)] text-xs"
            onClick={() => openUrl("https://base.org/builders/minikit")}
          >
            Built on Base with MiniKit
          </Button>
        </footer>
      </div>
    </div>
  );
}