import React, { useCallback, useState } from "react";
import Button from "../Button/Button";
import DecryptedText from "../HeadingReveal/DecryptText";
import { motion } from "motion/react";
import { anticipate } from "motion";
import Icon from "../Icon/Icon";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

interface WalletButtonProps {
  disabled?: boolean;
  isLoading?: boolean;
}

export default function WalletMultiButton({
  disabled = false,
  isLoading = false,
}: WalletButtonProps) {
  const [isHoveringLocal, setIsHoveringLocal] = useState<boolean>(false);
  const { publicKey, disconnect, connected, connecting } = useWallet();
  const { setVisible: setModalVisible } = useWalletModal();

  const showDisconnectOverlay = isHoveringLocal && connected;

  const getButtonLabel = useCallback(() => {
    if (connecting) return "Connecting...";
    if (connected && publicKey) {
      return `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`;
    }
    return "Connect Wallet";
  }, [connected, publicKey, connecting]);

  const buttonLabel = getButtonLabel();

  const handleClick = useCallback(() => {
    if (connected) {
      disconnect();
    } else {
      setModalVisible(true);
    }
  }, [connected, disconnect, setModalVisible]);

  return (
    <div
      onMouseEnter={() => setIsHoveringLocal(true)}
      onMouseLeave={() => setIsHoveringLocal(false)}
      className="relative"
    >
      <Button
        disabled={disabled || isLoading || connecting}
        label={buttonLabel}
        icon="Wallet"
        variant="primary"
        className="overflow-hidden"
        onClick={handleClick}
      />
      {showDisconnectOverlay && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-white/5 backdrop-blur-[8px] rounded-xl">
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3, ease: anticipate }}
            className="flex items-center gap-x-1.5 font-mono text-[15px] font-medium leading-none text-black"
          >
            <Icon name="Disconnect" />
            <DecryptedText isHovering={isHoveringLocal} text="Disconnect" />
          </motion.span>
        </div>
      )}
    </div>
  );
}
