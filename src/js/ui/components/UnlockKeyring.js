import React from 'react';

import { useForm } from 'react-hook-form';
import { Form, FormGroup, Input, Row, Col, Button } from 'reactstrap';

export default function UnlockKeyring() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const unlock = data => {
    chrome.runtime.sendMessage(
      { command: 'unlockKeyring', password: data.password },
      () => {}
    );
  };

  const { ref: passwordFieldRef, ...passwordFieldRest } = register('password', {
    required: true,
  });

  return (
    <Form onSubmit={handleSubmit(unlock)}>
      <Row>
        <Col className="d-grid gap-2 col-lg-3 mx-auto">
          <h4 className="text-dark text-center mt-4">Welcome</h4>
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
            {errors.password && <span>This field is required</span>}
          </FormGroup>
          <Button color="primary" block={true} type="submit" className="mt-2">
            UNLOCK
          </Button>
        </Col>
      </Row>
    </Form>
  );
}
