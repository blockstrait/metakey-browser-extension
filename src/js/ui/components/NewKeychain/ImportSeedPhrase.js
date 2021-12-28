import React, { useRef } from 'react';

import { useForm } from 'react-hook-form';
import {
  Container,
  Form,
  FormGroup,
  Input,
  Row,
  Col,
  Button,
  Label,
} from 'reactstrap';

const ImportSeedPhrase = props => {
  const { onSeedPhraseImported } = props;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const password = useRef({});

  password.current = watch('password', '');

  const onSubmit = data => {
    onSeedPhraseImported(data.password, data.mnemonic);
  };

  const { ref: mnemonicFieldRef, ...mnemonicFieldRest } = register('mnemonic', {
    required: 'You must specify a valid seed phrase (12 words)',
    validate: value => {
      const words = value.split(' ');

      return words.length === 12 || 'Invalid seed phrase';
    },
  });

  const { ref: passwordFieldRef, ...passwordFieldRest } = register('password', {
    required: 'You must specify a password',
    minLength: {
      value: 8,
      message: 'Password must have at least 8 characters',
    },
  });

  const { ref: confirmPasswordFieldRef, ...confirmPasswordFieldRest } =
    register('confirmPassword', {
      validate: value =>
        value === password.current || 'The passwords do not match',
    });

  return (
    <Container>
      <h4 className="text-dark mt-4">Create new password</h4>
      <Form onSubmit={handleSubmit(onSubmit)}>
        <Row className="mt-2 mr-1 ml-1">
          <Col>
            <FormGroup className="mt-2">
              <Label for="mnemonic">Enter your existing seed phrase</Label>
              <Input
                {...mnemonicFieldRest}
                type="mnemonic"
                name="mnemonic"
                id="mnemonic"
                innerRef={mnemonicFieldRef}
              />
              {errors.mnemonic && (
                <span className="text-danger">{errors.mnemonic.message}</span>
              )}
            </FormGroup>
          </Col>
        </Row>
        <Row className="mt-2 mr-1 ml-1">
          <Col>
            <FormGroup className="mt-2">
              <Label for="password">Enter a password</Label>
              <Input
                {...passwordFieldRest}
                type="password"
                name="password"
                id="password"
                innerRef={passwordFieldRef}
              />
              {errors.password && (
                <span className="text-danger">{errors.password.message}</span>
              )}
            </FormGroup>
          </Col>
        </Row>
        <Row>
          <Col>
            <FormGroup className="mt-2">
              <Label for="confirmPassword">Confirm password</Label>
              <Input
                {...confirmPasswordFieldRest}
                type="password"
                name="confirmPassword"
                id="confirmPassword"
                innerRef={confirmPasswordFieldRef}
              />
              {errors.confirmPassword && (
                <span className="text-danger">
                  {errors.confirmPassword.message}
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
      </Form>
    </Container>
  );
};

export default ImportSeedPhrase;
