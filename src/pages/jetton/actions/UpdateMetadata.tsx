import { Box } from "@mui/material";
import { styled } from "@mui/system";
import { Popup } from "components/Popup";
import useJettonStore from "store/jetton-store/useJettonStore";
import { useContext, useState } from "react";
import { onchainFormSpec } from "pages/deployer/data";
import Form from "components/Form";
import { JettonStoreState } from "store/jetton-store";
import { jettonDeployController } from "lib/deploy-controller";
import WalletConnection from "services/wallet-connection";
import { Address } from "ton";
import useNotification from "hooks/useNotification";
import { AppButton } from "components/appButton";
import { JettonActionsContext } from "pages/jetton/context/JettonActionsContext";

const inputsName = ["name", "symbol", "decimals", "tokenImage", "description"];

const getInputs = () => {
  return onchainFormSpec
    .filter((specInput) => {
      return inputsName.includes(specInput.name);
    })
    .map((specInput) => {
      return {
        ...specInput,
        disabled: specInput.name === "decimals" ? true : undefined,
      };
    });
};

const createDefaults = (state: JettonStoreState) => {
  const obj = {} as any;
  inputsName.forEach((key: string) => {
    if (key === "tokenImage") {
      obj[key] = state["jettonImage" as keyof JettonStoreState];
    } else {
      obj[key] = state[key as keyof JettonStoreState];
    }
  });
  return obj;
};

const inputs = getInputs();

function UpdateMetadata() {
  const store = useJettonStore();
  const { isAdmin, getJettonDetails, jettonMaster } = store;
  const [open, setOpen] = useState(false);
  const { startAction, finishAction } = useContext(JettonActionsContext);
  const { showNotification } = useNotification();

  if (!isAdmin) {
    return null;
  }

  const onSubmit = async (values: any) => {
    startAction();
    try {
      if (!jettonMaster) {
        throw new Error("");
      }

      await jettonDeployController.updateMetadata(
        Address.parse(jettonMaster),
        {
          symbol: values.symbol,
          name: values.name,
          description: values.description,
          image: values.tokenImage,
          decimals: values.decimals,
        },
        WalletConnection.getConnection(),
      );
      await getJettonDetails();
      setOpen(false);
    } catch (error) {
      if (error instanceof Error) {
        showNotification(error.message, "error");
      }
    } finally {
      finishAction();
      setOpen(false);
    }
  };

  const defaultValues = createDefaults(store);

  return (
    <StyledContainer>
      <AppButton onClick={() => setOpen(true)}>Update metadata</AppButton>
      <Popup maxWidth={600} open={open} onClose={() => setOpen(false)}>
        <Form
          submitText="Update metadata"
          disableExample={true}
          onSubmit={onSubmit}
          inputs={inputs}
          defaultValues={defaultValues}
        />
      </Popup>
    </StyledContainer>
  );
}

export default UpdateMetadata;

export const StyledContainer = styled(Box)({
  height: 40,
});
