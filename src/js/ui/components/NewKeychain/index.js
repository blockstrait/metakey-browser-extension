import React, { Fragment, useState } from 'react';

import { Container, Row, Col, Button } from 'reactstrap';

import useBackgroundConnection from '../../UseBackgroundConnection';
import MyLoader from '../MyLoader';
import BackupMnemonic from './BackupMnemonic';
import ConfirmMnemonic from './ConfirmMnemonic';
import CreateNewPassword from './CreateNewPassword';
import ImportSeedPhrase from './ImportSeedPhrase';
import KeychainCreated from './KeychainCreated';

const NewKeychain = () => {
  const [step, setStep] = useState('start');
  const [mnemonic, setMnemonic] = useState(null);
  const [password, setPassword] = useState(null);

  const { isLoading, sendBackgroundCommand } = useBackgroundConnection();

  const onGenerateSeedPhraseButtonClick = () => {
    setStep('createNewPassword');
  };

  const onImportSeedPhraseButtonClick = () => {
    setStep('importSeedPhrase');
  };

  const onPasswordCreated = password => {
    async function _sendBackgroundCommand() {
      const response = await sendBackgroundCommand({
        command: 'generateMnemonic',
      });

      if (response.status === 'success') {
        setMnemonic(response.mnemonic);
        setPassword(password);
        setStep('backupMnemonic');
      }
    }

    _sendBackgroundCommand();
  };

  const onMnemonicShown = () => {
    setStep('confirmMnemonic');
  };

  const onMnemonicConfirmed = () => {
    async function _sendBackgroundCommand() {
      const response = await sendBackgroundCommand({
        command: 'initializeKeyring',
        params: { password, mnemonic },
      });

      if (response.status === 'success') {
        setStep('keychainCreated');
      }
    }

    _sendBackgroundCommand();
  };

  const onSeedPhraseImported = (password, mnemonic) => {
    async function _sendBackgroundCommand() {
      const response = await sendBackgroundCommand({
        command: 'initializeKeyring',
        params: { password, mnemonic },
      });

      if (response.status === 'success') {
        setStep('keychainCreated');
      }
    }

    _sendBackgroundCommand();
  };

  if (isLoading) {
    return <MyLoader />;
  }

  return (
    <Fragment>
      {step === 'start' && (
        <Container>
          <h5 className="text-dark text-center mt-4">Welcome</h5>
          <Row>
            <Col className="d-grid gap-2 col-lg-3 mx-auto my-3">
              <Button
                color="primary"
                block={true}
                outline={true}
                className="px-4 py-2"
                onClick={() => onGenerateSeedPhraseButtonClick()}
              >
                Generate a new keychain
              </Button>
            </Col>
          </Row>
          <Row>
            <Col className="text-center">or</Col>
          </Row>
          <Row>
            <Col className="d-grid gap-2 col-lg-3 mx-auto my-3">
              <Button
                color="primary"
                block={true}
                outline={true}
                className="px-4 py-2"
                onClick={() => onImportSeedPhraseButtonClick()}
              >
                Import an existing keychain
              </Button>
            </Col>
          </Row>
        </Container>
      )}
      {step === 'createNewPassword' && (
        <CreateNewPassword onPasswordCreated={onPasswordCreated} />
      )}
      {step === 'backupMnemonic' && mnemonic !== null && (
        <BackupMnemonic mnemonic={mnemonic} onMnemonicShown={onMnemonicShown} />
      )}
      {step === 'confirmMnemonic' && mnemonic !== null && password !== null && (
        <ConfirmMnemonic
          mnemonic={mnemonic}
          onMnemonicConfirmed={onMnemonicConfirmed}
        />
      )}
      {step === 'importSeedPhrase' && (
        <ImportSeedPhrase onSeedPhraseImported={onSeedPhraseImported} />
      )}
      {step === 'keychainCreated' && <KeychainCreated />}
    </Fragment>
  );
};

export default NewKeychain;
