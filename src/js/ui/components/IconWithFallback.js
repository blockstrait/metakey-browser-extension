import React, { Fragment, useState } from 'react';

const IconWithFallback = props => {
  const [iconError, setIconError] = useState(false);

  const { iconUrl } = props;

  return (
    <Fragment>
      {!iconError && iconUrl ? (
        <img
          width={20}
          className="icon-with-fallback__identicon"
          src={iconUrl}
          onError={() => setIconError(true)}
        />
      ) : (
        <i className="icon-with-fallback__identicon--default">
          {origin.length ? origin.charAt(0).toUpperCase() : ''}
        </i>
      )}
    </Fragment>
  );
};

export default IconWithFallback;
