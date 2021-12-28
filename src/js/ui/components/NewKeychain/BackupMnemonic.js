import React, { Fragment } from 'react';

import { Row, Col, Button, Alert } from 'reactstrap';

function numPaddedWithLeadingZero(num) {
  num = num.toString();

  while (num.length < 2) num = '0' + num;

  return num;
}

function BackupMnemonic(props) {
  const { mnemonic, onMnemonicShown } = props;

  const mnemonicOrganizedInWords = [[], [], [], [], [], []];

  mnemonic.split(' ').forEach((value, index) => {
    mnemonicOrganizedInWords[Math.floor(index / 2)].push({
      num: numPaddedWithLeadingZero(index + 1),
      value,
    });
  });

  return (
    <Fragment>
      <h5 className="text-dark mt-4">Backup your seed phrase</h5>
      <Alert color="info mt-3">
        {mnemonicOrganizedInWords.map((rowWords, rowIndex) => (
          <Row key={`row#${rowIndex}`}>
            {rowWords.map(word => (
              <Col className="col-6 mx-auto my-2" key={`word#${word.num}`}>
                <small className="text-secondary">
                  <strong>#{word.num}</strong>
                </small>{' '}
                <strong>{word.value}</strong>
              </Col>
            ))}
          </Row>
        ))}
      </Alert>
      <Row>
        <Col className="d-grid gap-2 col-lg-3 mx-auto mt-">
          <Button
            color="primary"
            type="submit"
            block={true}
            onClick={() => onMnemonicShown()}
            className="px-4 py-2"
          >
            Continue
          </Button>
        </Col>
      </Row>
    </Fragment>
  );
}

export default BackupMnemonic;
