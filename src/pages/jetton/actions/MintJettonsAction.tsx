import { Typography } from "@mui/material";
import BigNumberDisplay from "components/BigNumberDisplay";
import { Popup } from "components/Popup";
import useNotification from "hooks/useNotification";
import { jettonDeployController } from "lib/deploy-controller";
import { useContext, useState } from "react";
import WalletConnection from "services/wallet-connection";
import useJettonStore from "store/jetton-store/useJettonStore";
import { Address } from "ton";
import { toDecimalsBN } from "utils";
import { AppButton } from "components/appButton";
import { AppNumberInput } from "components/appInput";
import { JettonActionsContext } from "pages/jetton/context/JettonActionsContext";

function MintJettonsAction() {
  const [amount, setAmount] = useState<number | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const { actionInProgress, startAction, finishAction } = useContext(JettonActionsContext);
  const { jettonMaster, isAdmin, symbol, getJettonDetails, isMyWallet, decimals } =
    useJettonStore();
  const { showNotification } = useNotification();

  if (!isAdmin || !isMyWallet) {
    return null;
  }

  const onMint = async () => {
    if (!jettonMaster) {
      return;
    }

    if (!amount || amount === 0) {
      showNotification(`Minimum amount of ${symbol} to mint is 1`, "warning");
      return;
    }
    const value = toDecimalsBN(amount, decimals!);

    try {
      startAction();
      const connection = WalletConnection.getConnection();
      await jettonDeployController.mint(connection, Address.parse(jettonMaster), value);
      setOpen(false);
      const message = (
        <>
          Successfully minted <BigNumberDisplay value={amount} /> {symbol}
        </>
      );
      getJettonDetails();
      showNotification(message, "success");
    } catch (error) {
      console.log(error);
      if (error instanceof Error) {
        showNotification(error.message, "error");
      }
    } finally {
      finishAction();
      setOpen(false);
    }
  };

  const onClose = () => {
    setAmount(0);
    setOpen(false);
  };

  return (
    <>
      <Popup open={open && !actionInProgress} onClose={onClose} maxWidth={400}>
        <>
          <Typography className="title">Mint {symbol}</Typography>
          <AppNumberInput
            label={`Enter ${symbol} amount`}
            value={amount}
            onChange={(value: number) => setAmount(value)}
          />
          <AppButton onClick={onMint}>Submit</AppButton>
        </>
      </Popup>
      <AppButton transparent={true} onClick={() => setOpen(true)}>
        Mint
      </AppButton>
    </>
  );
}

export default MintJettonsAction;
