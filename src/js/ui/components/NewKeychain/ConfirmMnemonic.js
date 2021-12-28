import React, { Fragment, useEffect, useState } from 'react';

import { useForm } from 'react-hook-form';
import {
  Form,
  FormGroup,
  Label,
  Input,
  Row,
  Col,
  Button,
  CustomInput,
} from 'reactstrap';

function wordNumPaddedWithLeadingZero(wordNumStr) {
  const wordNum = parseInt(wordNumStr) + 1;

  let num = `${wordNum}`;

  while (num.length < 2) num = `0${num}`;

  return num;
}

function ConfirmMnemonic(props) {
  const { mnemonic, onMnemonicConfirmed } = props;

  const [wordsToConfirmIndexList, setWordsToConfirmIndexList] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    const _wordsToConfirmIndexList = [
      Math.floor(Math.random() * 12),
      Math.floor(Math.random() * 12),
      Math.floor(Math.random() * 12),
    ];

    setWordsToConfirmIndexList(_wordsToConfirmIndexList);
  }, [mnemonic]);

  const onSubmit = () => {
    onMnemonicConfirmed();
  };

  if (wordsToConfirmIndexList === null) {
    return '';
  }

  const formInputs = {};

  wordsToConfirmIndexList.forEach(wordNum => {
    const { ref: mnemonicWordFieldRef, ...mnemonicWordFieldRest } = register(
      `mnemonicWord.${wordNum}`,
      {
        required: 'You must specify a value',
        validate: value => {
          const mnemonicWordList = mnemonic.split(' ');

          return (
            value === mnemonicWordList[wordNum] || 'The word does not match'
          );
        },
      }
    );

    formInputs[wordNum] = {
      mnemonicWordFieldRef,
      mnemonicWordFieldRest,
    };
  });

  const { ref: confirmSeedBackupFieldRef, ...confirmSeedBackupFieldRest } =
    register('confirmSeedBackup', {
      validate: value =>
        value === 'yes' ||
        'You must confirm that you have backed up your seed phrase',
    });

  return (
    <Fragment>
      <h4 className="text-dark text-center mt-4">Confirm your seed phrase</h4>
      <Form onSubmit={handleSubmit(onSubmit)}>
        <FormGroup>
          {Object.keys(formInputs).map(wordNum => (
            <Row className="mt-2 mr-1 ml-1" key={wordNum}>
              <Col className="col-12">
                <FormGroup>
                  <Label for={`mnemonicWord.${wordNum}`}>
                    #{wordNumPaddedWithLeadingZero(wordNum)}
                  </Label>
                  <Input
                    {...formInputs[wordNum].mnemonicWordFieldRest}
                    type="password"
                    name={`mnemonicWord.${wordNum}`}
                    placeholder={`Enter word #${wordNumPaddedWithLeadingZero(
                      wordNum
                    )}`}
                    innerRef={formInputs[wordNum].mnemonicWordFieldRef}
                  />
                  {errors.mnemonicWord && errors.mnemonicWord[wordNum] && (
                    <span className="text-danger">
                      {errors.mnemonicWord[wordNum].message}
                    </span>
                  )}
                </FormGroup>
              </Col>
            </Row>
          ))}
          <Row>
            <Col className="col-lg-3 mx-auto mt-3">
              <FormGroup>
                <CustomInput
                  {...confirmSeedBackupFieldRest}
                  type="checkbox"
                  value="yes"
                  id="confirmSeedBackup"
                  name="confirmSeedBackup"
                  label="&nbsp;I have backed up my seed phrase."
                  innerRef={confirmSeedBackupFieldRef}
                />
                {errors.confirmSeedBackup && (
                  <span className="text-danger">
                    {errors.confirmSeedBackup.message}
                  </span>
                )}
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col className="d-grid gap-2 col-lg-3 mx-auto mt-3">
              <Button
                color="primary"
                type="submit"
                block={true}
                className="px-4 py-2"
              >
                Continue
              </Button>
            </Col>
          </Row>
        </FormGroup>
      </Form>
    </Fragment>
  );
}

export default ConfirmMnemonic;
