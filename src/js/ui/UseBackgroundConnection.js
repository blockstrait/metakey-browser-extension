import { useContext } from 'react';

import BackgroundConnectionContext from './BackgroundConnectionContext';

const useBackgroundConnection = () => useContext(BackgroundConnectionContext);

export default useBackgroundConnection;
