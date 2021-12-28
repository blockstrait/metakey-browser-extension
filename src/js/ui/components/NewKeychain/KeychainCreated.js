import { faCheckCircle } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { Fragment } from 'react';

function KeychainCreated() {
  return (
    <Fragment>
      <h4 className=" mt-4 text-dark text-center">All done!</h4>
      <p className="mt-4 text-center text-success">
        <FontAwesomeIcon icon={faCheckCircle} size="5x" />
      </p>
    </Fragment>
  );
}

export default KeychainCreated;
