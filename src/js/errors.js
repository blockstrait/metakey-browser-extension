class MetakeyError extends Error {}

class UnexpectedError extends MetakeyError {
  constructor(message) {
    super(message);

    this.externalMessage = 'Unexpected error';
  }
}

class InvalidParametersError extends MetakeyError {
  constructor(message) {
    super(message);

    this.externalMessage = 'Invalid parameters';
  }
}

class RequestRejectedError extends MetakeyError {
  constructor(message) {
    super(message);

    this.externalMessage = 'User rejected the request';
  }
}

export {
  MetakeyError,
  UnexpectedError,
  InvalidParametersError,
  RequestRejectedError,
};
