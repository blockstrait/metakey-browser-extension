import React from 'react';

import { Loader } from 'react-loaders';

const MyLoader = () => {
  return (
    <div className="mx-auto" style={{ width: '60px', height: '40px' }}>
      <Loader active type="ball-pulse" />
    </div>
  );
};

export default MyLoader;
