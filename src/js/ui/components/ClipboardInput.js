import { faCopy } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { Fragment, useEffect, useState } from 'react';

import { CopyToClipboard } from 'react-copy-to-clipboard';
import {
  Button,
  InputGroup,
  Input,
  InputGroupAddon,
  FormText,
} from 'reactstrap';

const ClipboardInput = props => {
  const { text } = props;

  const [state, setState] = useState({ value: '', copied: false });

  const onChange = ({ target: { value } }) => {
    setState({ value, copied: false });
  };

  const onCopy = () => {
    setState({ value: state.value, copied: true });
  };

  useEffect(() => {
    setState({ value: text, copied: false });
  }, [text]);

  return (
    <Fragment>
      <InputGroup>
        <Input defaultValue={state.value} onChange={onChange} />
        <InputGroupAddon addonType="append">
          <CopyToClipboard onCopy={onCopy} text={state.value}>
            <Button color="primary">
              <FontAwesomeIcon icon={faCopy} size="1x" />
            </Button>
          </CopyToClipboard>
        </InputGroupAddon>
      </InputGroup>
      {state.copied && (
        <FormText color="success" className="mt-2">
          Value has been copied!
        </FormText>
      )}
    </Fragment>
  );
};

export default ClipboardInput;
