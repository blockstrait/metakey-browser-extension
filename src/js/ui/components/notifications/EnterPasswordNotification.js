import React from 'react';

import { useForm } from 'react-hook-form';
import {
  Container,
  Form,
  FormGroup,
  Input,
  Row,
  Col,
  Button,
} from 'reactstrap';

import useBackgroundConnection from '../../UseBackgroundConnection';
import MyLoader from '../MyLoader';

const EnterPasswordNotification = () => {
  const { register, handleSubmit, formState, setError } = useForm();

  const { errors } = formState;

  const { isLoading, sendBackgroundCommand } = useBackgroundConnection();

  const unlock = data => {
    async function _sendBackgroundCommand() {
      const response = await sendBackgroundCommand({
        command: 'enterPassword',
        password: data.password,
      });

      if (response.status !== 'success') {
        setError('password', {
          type: 'manual',
          message: 'Invalid password. Please try again',
        });
      }
    }

    _sendBackgroundCommand();
  };

  if (isLoading) {
    return <MyLoader />;
  }

  const { ref: passwordFieldRef, ...passwordFieldRest } = register('password', {
    required: 'Please enter a password',
  });

  return (
    <Container>
      <Form onSubmit={handleSubmit(unlock)}>
        <Row>
          <Col className="d-grid gap-2 col-lg-3 mx-auto">
            <h4 className="text-dark text-center mt-4">Unlock your keychain</h4>
            <span className="font-weight-light text-center">
              Enter your password to continue
            </span>
            <FormGroup className="mt-2">
              <Input
                {...passwordFieldRest}
                type="password"
                name="password"
                id="password"
                placeholder="Type your password"
                innerRef={passwordFieldRef}
              />
              {errors.password && (
                <p className="text-danger">{errors.password.message}</p>
              )}
            </FormGroup>
            <Button color="primary" block={true} type="submit" className="mt-2">
              UNLOCK
            </Button>
          </Col>
        </Row>
      </Form>
    </Container>
  );
};

export default EnterPasswordNotification;
